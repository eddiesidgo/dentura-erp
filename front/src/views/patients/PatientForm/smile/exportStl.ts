import * as THREE from 'three'

/** Merge multiple BufferGeometries into one in world space and export binary STL. */
export function geometriesToBinaryStl(
    items: { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4 }[],
    solidName = 'dentura_smile',
): Blob {
    const triangles: { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; n: THREE.Vector3 }[] =
        []

    for (const item of items) {
        const geom = item.geometry.index
            ? item.geometry.toNonIndexed()
            : item.geometry.clone()
        const pos = geom.getAttribute('position')
        if (!pos) {
            continue
        }
        const vA = new THREE.Vector3()
        const vB = new THREE.Vector3()
        const vC = new THREE.Vector3()
        const cb = new THREE.Vector3()
        const ab = new THREE.Vector3()
        for (let i = 0; i < pos.count; i += 3) {
            vA.fromBufferAttribute(pos, i).applyMatrix4(item.matrix)
            vB.fromBufferAttribute(pos, i + 1).applyMatrix4(item.matrix)
            vC.fromBufferAttribute(pos, i + 2).applyMatrix4(item.matrix)
            cb.subVectors(vC, vB)
            ab.subVectors(vA, vB)
            const n = new THREE.Vector3().crossVectors(cb, ab).normalize()
            triangles.push({
                a: vA.clone(),
                b: vB.clone(),
                c: vC.clone(),
                n,
            })
        }
        geom.dispose()
    }

    const buffer = new ArrayBuffer(84 + triangles.length * 50)
    const view = new DataView(buffer)
    const encoder = new TextEncoder()
    const header = encoder.encode(solidName.padEnd(80, ' ').slice(0, 80))
    for (let i = 0; i < 80; i++) {
        view.setUint8(i, header[i] ?? 0x20)
    }
    view.setUint32(80, triangles.length, true)
    let offset = 84
    for (const tri of triangles) {
        view.setFloat32(offset, tri.n.x, true)
        view.setFloat32(offset + 4, tri.n.y, true)
        view.setFloat32(offset + 8, tri.n.z, true)
        offset += 12
        for (const v of [tri.a, tri.b, tri.c]) {
            view.setFloat32(offset, v.x, true)
            view.setFloat32(offset + 4, v.y, true)
            view.setFloat32(offset + 8, v.z, true)
            offset += 12
        }
        view.setUint16(offset, 0, true)
        offset += 2
    }
    return new Blob([buffer], { type: 'model/stl' })
}

export function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
}
