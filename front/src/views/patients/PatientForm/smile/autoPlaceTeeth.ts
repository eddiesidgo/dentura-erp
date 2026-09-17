import * as THREE from 'three'
import type { SmileDesignDocument, SmileStyle, ToothTransform } from '@/@types/smile'
import {
    UPPER_ANTERIORS,
    defaultTeethForStyle,
    scaleForToothSize,
} from './toothTemplates'

type Axis = 'x' | 'y' | 'z'

const TOOTH_SLOT: Record<string, number> = {
    '13': -2.5,
    '12': -1.5,
    '11': -0.5,
    '21': 0.5,
    '22': 1.5,
    '23': 2.5,
}

/** Relative MD widths 13→23 (same ratios as widthScaleFor). */
const WIDTH_UNITS = 0.88 + 0.78 + 1 + 1 + 0.78 + 0.88

type CrestPoint = {
    position: THREE.Vector3
    lateral: number
    anterior: number
    up: number
}

/**
 * Auto-place anterior templates on a scan mesh as a starting layout.
 * Fits the occlusal/incisal crest of the scan, then snaps along -up.
 */
export function autoPlaceTeethOnScan(
    scanGeometry: THREE.BufferGeometry,
    style: SmileStyle | string = 'OVAL',
): { teeth: ToothTransform[]; archWidth: number; toothLength: number } {
    const geometry = scanGeometry.index
        ? scanGeometry.toNonIndexed()
        : scanGeometry.clone()
    geometry.computeBoundingBox()
    geometry.computeVertexNormals()
    const box = geometry.boundingBox
    if (!box) {
        throw new Error('No se pudo leer el bounding box del scan')
    }

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const extents: { axis: Axis; len: number }[] = [
        { axis: 'x', len: size.x },
        { axis: 'y', len: size.y },
        { axis: 'z', len: size.z },
    ].sort((a, b) => a.len - b.len)

    // Smallest extent ≈ occlusal "height" axis for most dental scans.
    const upAxis = extents[0].axis
    const midAxis = extents[1].axis
    const longAxis = extents[2].axis

    const up = axisVector(upAxis)
    const right = axisVector(longAxis)
    const forward = axisVector(midAxis)

    const anterior = pickAnteriorDirection(geometry, center, forward, right)
    const lateral = new THREE.Vector3().crossVectors(up, anterior).normalize()
    if (lateral.lengthSq() < 1e-6) {
        lateral.copy(right)
    }

    const crest = sampleIncisalCrest(geometry, center, up, anterior, lateral)
    if (crest.length < 6) {
        if (geometry !== scanGeometry) {
            geometry.dispose()
        }
        throw new Error('No se pudo detectar el arco dental en el scan')
    }

    const latMin = crest[0].lateral
    const latMax = crest[crest.length - 1].lateral
    const archWidth = Math.max(8, latMax - latMin)
    // Crest tip-to-tip is a bit tighter than full MD packing; bias ~12% larger.
    const centralWidth = (archWidth / WIDTH_UNITS) * 1.12
    // Crown length from local crest “thickness” in up, floored by clinical ratio.
    const upValues = crest.map((p) => p.up)
    const crestUpSpan =
        Math.max(...upValues) - Math.min(...upValues) || size[upAxis] * 0.15
    const toothLength = Math.max(
        centralWidth * 1.28,
        crestUpSpan * 1.5,
        size[upAxis] * 0.2,
    )

    const mesh = new THREE.Mesh(geometry)
    mesh.updateMatrixWorld(true)
    const raycaster = new THREE.Raycaster()
    const maxDim = Math.max(size.x, size.y, size.z)

    const teeth: ToothTransform[] = UPPER_ANTERIORS.map((toothId) => {
        const slot = TOOTH_SLOT[toothId] ?? 0
        // Map slots -2.5..2.5 onto the measured crest span.
        const u = (slot + 2.5) / 5
        const targetLateral = latMin + u * (latMax - latMin)
        const along = interpolateCrest(crest, targetLateral)

        // Seed slightly above the crest, then snap straight down onto enamel.
        const seed = along.position
            .clone()
            .addScaledVector(up, toothLength * 0.35)
            .addScaledVector(anterior, toothLength * 0.05)

        const hit =
            snapAlong(raycaster, mesh, seed, up.clone().negate(), maxDim) ||
            snapAlong(raycaster, mesh, seed, anterior, maxDim)

        // Long axis = occlusal up, with a light labial tip — not the face normal
        // (that laid crowns on their side when raycasts hit the labial surface).
        const toothUp = up
            .clone()
            .addScaledVector(anterior, 0.1)
            .normalize()

        const position = hit?.point.clone() ?? along.position.clone()
        // Template crown points +Y (incisal). Anchor the tip near the crest
        // hit and let the body extend toward the gingiva (-toothUp).
        position.addScaledVector(toothUp, -toothLength * 0.42)

        const tangent = crestTangent(crest, targetLateral, lateral)
        const rotation = basisToEuler(toothUp, anterior, tangent, slot / 2.5)
        const widthFactor = centralWidth / toothLength

        return {
            tooth: toothId,
            position: [position.x, position.y, position.z],
            rotation: [rotation.x, rotation.y, rotation.z],
            scale: scaleForToothSize(toothId, toothLength, widthFactor, 0.72),
            shape: style,
        }
    })

    if (geometry !== scanGeometry) {
        geometry.dispose()
    }

    return { teeth, archWidth, toothLength }
}

export function applyAutoPlaceToDocument(
    document: SmileDesignDocument,
    scanGeometry: THREE.BufferGeometry,
): SmileDesignDocument {
    const style = (document.style || 'OVAL') as SmileStyle
    const placed = autoPlaceTeethOnScan(scanGeometry, style)
    const fallback = defaultTeethForStyle(
        style,
        placed.archWidth,
        placed.toothLength,
        document.midlineOffset || 0,
    )
    return {
        ...document,
        style,
        archWidth: placed.archWidth,
        toothLength: placed.toothLength,
        teeth: placed.teeth.length ? placed.teeth : fallback,
        selectedTooth: null,
        suggestedBy: 'auto-place-v3',
    }
}

function axisVector(axis: Axis) {
    if (axis === 'x') {
        return new THREE.Vector3(1, 0, 0)
    }
    if (axis === 'y') {
        return new THREE.Vector3(0, 1, 0)
    }
    return new THREE.Vector3(0, 0, 1)
}

function pickAnteriorDirection(
    geometry: THREE.BufferGeometry,
    center: THREE.Vector3,
    forward: THREE.Vector3,
    right: THREE.Vector3,
) {
    const pos = geometry.getAttribute('position')
    let scoreF = 0
    let scoreR = 0
    const v = new THREE.Vector3()
    const step = Math.max(1, Math.floor(pos.count / 4000))
    for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).sub(center)
        scoreF += Math.max(0, v.dot(forward))
        scoreR += Math.max(0, v.dot(right))
    }
    if (scoreR > scoreF) {
        return right.clone().normalize()
    }
    return forward.clone().normalize()
}

/**
 * Build an ordered polyline of the anterior incisal crest by binning the
 * highest "up" vertices across the front of the arch.
 */
function sampleIncisalCrest(
    geometry: THREE.BufferGeometry,
    center: THREE.Vector3,
    up: THREE.Vector3,
    anterior: THREE.Vector3,
    lateral: THREE.Vector3,
): CrestPoint[] {
    const pos = geometry.getAttribute('position')
    const step = Math.max(1, Math.floor(pos.count / 25000))
    const samples: CrestPoint[] = []
    const v = new THREE.Vector3()

    for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i)
        const rel = v.clone().sub(center)
        samples.push({
            position: v.clone(),
            lateral: rel.dot(lateral),
            anterior: rel.dot(anterior),
            up: rel.dot(up),
        })
    }

    // Keep the anterior half of the arch (toward the lips).
    samples.sort((a, b) => b.anterior - a.anterior)
    const frontCount = Math.max(80, Math.floor(samples.length * 0.22))
    const front = samples.slice(0, frontCount)

    // Among the front, keep the upper occlusal band.
    front.sort((a, b) => b.up - a.up)
    const crestBand = front.slice(0, Math.max(40, Math.floor(front.length * 0.18)))

    const latMin = Math.min(...crestBand.map((p) => p.lateral))
    const latMax = Math.max(...crestBand.map((p) => p.lateral))
    const span = Math.max(1e-3, latMax - latMin)
    // Trim extreme outliers (tuberosity / artifacts) to the central 84%.
    const trim = span * 0.08
    const trimmed = crestBand.filter(
        (p) => p.lateral >= latMin + trim && p.lateral <= latMax - trim,
    )
    const usable = trimmed.length >= 12 ? trimmed : crestBand

    const binCount = 18
    const bins: CrestPoint[][] = Array.from({ length: binCount }, () => [])
    const uMin = Math.min(...usable.map((p) => p.lateral))
    const uMax = Math.max(...usable.map((p) => p.lateral))
    const uSpan = Math.max(1e-3, uMax - uMin)

    for (const point of usable) {
        const idx = Math.min(
            binCount - 1,
            Math.floor(((point.lateral - uMin) / uSpan) * binCount),
        )
        bins[idx].push(point)
    }

    const crest: CrestPoint[] = []
    for (const bin of bins) {
        if (!bin.length) {
            continue
        }
        // Highest point in the bin ≈ incisal edge.
        bin.sort((a, b) => b.up - a.up)
        const top = bin.slice(0, Math.max(1, Math.ceil(bin.length * 0.15)))
        const avg = new THREE.Vector3()
        let lateralSum = 0
        let anteriorSum = 0
        let upSum = 0
        for (const p of top) {
            avg.add(p.position)
            lateralSum += p.lateral
            anteriorSum += p.anterior
            upSum += p.up
        }
        avg.multiplyScalar(1 / top.length)
        crest.push({
            position: avg,
            lateral: lateralSum / top.length,
            anterior: anteriorSum / top.length,
            up: upSum / top.length,
        })
    }

    crest.sort((a, b) => a.lateral - b.lateral)
    return crest
}

function interpolateCrest(crest: CrestPoint[], targetLateral: number): CrestPoint {
    if (targetLateral <= crest[0].lateral) {
        return crest[0]
    }
    if (targetLateral >= crest[crest.length - 1].lateral) {
        return crest[crest.length - 1]
    }
    for (let i = 0; i < crest.length - 1; i += 1) {
        const a = crest[i]
        const b = crest[i + 1]
        if (targetLateral < a.lateral || targetLateral > b.lateral) {
            continue
        }
        const t =
            (targetLateral - a.lateral) /
            Math.max(1e-6, b.lateral - a.lateral)
        return {
            position: a.position.clone().lerp(b.position, t),
            lateral: targetLateral,
            anterior: a.anterior + (b.anterior - a.anterior) * t,
            up: a.up + (b.up - a.up) * t,
        }
    }
    return crest[Math.floor(crest.length / 2)]
}

function crestTangent(
    crest: CrestPoint[],
    targetLateral: number,
    fallbackLateral: THREE.Vector3,
) {
    const i = Math.max(
        1,
        Math.min(
            crest.length - 2,
            crest.findIndex((p) => p.lateral >= targetLateral),
        ),
    )
    const a = crest[Math.max(0, i - 1)]
    const b = crest[Math.min(crest.length - 1, i + 1)]
    const tangent = b.position.clone().sub(a.position)
    if (tangent.lengthSq() < 1e-8) {
        return fallbackLateral.clone()
    }
    // Ensure tangent points roughly along +lateral.
    if (tangent.dot(fallbackLateral) < 0) {
        tangent.negate()
    }
    return tangent.normalize()
}

function snapAlong(
    raycaster: THREE.Raycaster,
    mesh: THREE.Mesh,
    seed: THREE.Vector3,
    castDir: THREE.Vector3,
    maxDim: number,
): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
    const dir = castDir.clone().normalize()
    const origin = seed.clone().addScaledVector(dir.clone().negate(), maxDim * 0.08)
    raycaster.set(origin, dir)
    const hits = raycaster.intersectObject(mesh, false)
    if (!hits.length) {
        // Retry from farther away.
        origin.copy(seed).addScaledVector(dir.clone().negate(), maxDim * 0.55)
        raycaster.set(origin, dir)
        const retry = raycaster.intersectObject(mesh, false)
        if (!retry.length) {
            return null
        }
        const hit = retry[0]
        return {
            point: hit.point.clone(),
            normal:
                hit.face?.normal
                    ?.clone()
                    .transformDirection(mesh.matrixWorld)
                    .normalize() ?? dir.clone().negate(),
        }
    }
    const hit = hits[0]
    return {
        point: hit.point.clone(),
        normal:
            hit.face?.normal
                ?.clone()
                .transformDirection(mesh.matrixWorld)
                .normalize() ?? dir.clone().negate(),
    }
}

function basisToEuler(
    toothUp: THREE.Vector3,
    anterior: THREE.Vector3,
    tangent: THREE.Vector3,
    slotT: number,
) {
    const y = toothUp.clone().normalize()
    // Mesial-distal ≈ crest tangent, nudged toward midline for centrals.
    let x = tangent.clone().normalize()
    x.addScaledVector(anterior, -slotT * 0.04).normalize()
    let z = new THREE.Vector3().crossVectors(x, y).normalize()
    if (z.dot(anterior) < 0) {
        z.negate()
        x.negate()
    }
    x = new THREE.Vector3().crossVectors(y, z).normalize()
    const matrix = new THREE.Matrix4().makeBasis(x, y, z)
    return new THREE.Euler().setFromRotationMatrix(matrix, 'XYZ')
}
