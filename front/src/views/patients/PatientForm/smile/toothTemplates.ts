import * as THREE from 'three'
import type { SmileStyle, ToothTransform } from '@/@types/smile'

const UPPER_ANTERIORS = ['11', '12', '13', '21', '22', '23'] as const

/**
 * Bounding size of createToothGeometry('OVAL') at scale [1,1,1].
 * Keep in sync with the Lathe + scale() below — used so toothLength
 * means real world height, not an arbitrary factor.
 */
export const TOOTH_TEMPLATE_SIZE = {
    x: 0.81,
    y: 1.242,
    z: 0.675,
} as const

export function createToothGeometry(shape: SmileStyle | string = 'OVAL'): THREE.BufferGeometry {
    const profile = shapeProfile(shape)
    const geometry = new THREE.LatheGeometry(profile, 16)
    geometry.computeVertexNormals()
    geometry.center()
    // Crown points +Y (incisal), root toward -Y
    geometry.rotateX(Math.PI)
    geometry.scale(0.9, 1.15, 0.75)
    return geometry
}

/** Scale factors so the template matches a desired crown size in world units. */
export function scaleForToothSize(
    toothId: string,
    toothLength: number,
    widthFactor = 0.78,
    depthFactor = 0.7,
): [number, number, number] {
    const width = toothLength * widthFactor * widthScaleFor(toothId)
    const depth = toothLength * depthFactor
    return [
        width / TOOTH_TEMPLATE_SIZE.x,
        toothLength / TOOTH_TEMPLATE_SIZE.y,
        depth / TOOTH_TEMPLATE_SIZE.z,
    ]
}

function shapeProfile(shape: SmileStyle | string): THREE.Vector2[] {
    switch (shape) {
        case 'SQUARE':
            return [
                new THREE.Vector2(0.05, 0),
                new THREE.Vector2(0.42, 0.15),
                new THREE.Vector2(0.48, 0.55),
                new THREE.Vector2(0.45, 0.95),
                new THREE.Vector2(0.2, 1.05),
                new THREE.Vector2(0.02, 1.08),
            ]
        case 'TRIANGULAR':
            return [
                new THREE.Vector2(0.05, 0),
                new THREE.Vector2(0.5, 0.2),
                new THREE.Vector2(0.42, 0.55),
                new THREE.Vector2(0.28, 0.9),
                new THREE.Vector2(0.12, 1.05),
                new THREE.Vector2(0.02, 1.08),
            ]
        case 'HOLLYWOOD':
            return [
                new THREE.Vector2(0.04, 0),
                new THREE.Vector2(0.4, 0.12),
                new THREE.Vector2(0.46, 0.5),
                new THREE.Vector2(0.4, 0.92),
                new THREE.Vector2(0.18, 1.12),
                new THREE.Vector2(0.02, 1.18),
            ]
        default:
            return [
                new THREE.Vector2(0.05, 0),
                new THREE.Vector2(0.38, 0.18),
                new THREE.Vector2(0.45, 0.5),
                new THREE.Vector2(0.38, 0.9),
                new THREE.Vector2(0.18, 1.05),
                new THREE.Vector2(0.02, 1.08),
            ]
    }
}

export function defaultTeethForStyle(
    style: SmileStyle,
    archWidth = 52,
    toothLength = 10.5,
    midlineOffset = 0,
): ToothTransform[] {
    return UPPER_ANTERIORS.map((tooth) => {
        const slot = slotFor(tooth)
        const x = slot * (archWidth / 10) + midlineOffset
        return {
            tooth,
            position: [x, 0, -toothLength * 0.1],
            rotation: [tipFor(tooth), 0, 0],
            scale: scaleForToothSize(tooth, toothLength),
            shape: style,
        }
    })
}

function slotFor(tooth: string) {
    switch (tooth) {
        case '13':
            return -2.5
        case '12':
            return -1.5
        case '11':
            return -0.5
        case '21':
            return 0.5
        case '22':
            return 1.5
        case '23':
            return 2.5
        default:
            return 0
    }
}

function widthScaleFor(tooth: string) {
    switch (tooth) {
        case '11':
        case '21':
            return 1
        case '12':
        case '22':
            return 0.78
        case '13':
        case '23':
            return 0.88
        default:
            return 0.9
    }
}

function tipFor(tooth: string) {
    switch (tooth) {
        case '13':
            return 0.08
        case '12':
            return 0.04
        case '22':
            return -0.04
        case '23':
            return -0.08
        default:
            return 0
    }
}

export function emptyDesignDocument(style: SmileStyle = 'OVAL'): import('@/@types/smile').SmileDesignDocument {
    return {
        style,
        archWidth: 52,
        toothLength: 10.5,
        midlineOffset: 0,
        gingivalHeight: 0.03,
        incisalCurve: 1,
        teeth: defaultTeethForStyle(style),
        selectedTooth: null,
    }
}

export { UPPER_ANTERIORS }
