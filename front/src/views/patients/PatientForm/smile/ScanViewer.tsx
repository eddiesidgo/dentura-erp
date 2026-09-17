import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Center, Environment, OrbitControls } from '@react-three/drei'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import * as THREE from 'three'

type ScanViewerProps = {
    blob: Blob | null
    fileName?: string | null
    className?: string
}

const isPly = (fileName?: string | null, contentType?: string | null) => {
    const name = (fileName || '').toLowerCase()
    const type = (contentType || '').toLowerCase()
    return name.endsWith('.ply') || type.includes('ply')
}

const MeshFromBlob = ({
    blob,
    fileName,
}: {
    blob: Blob
    fileName?: string | null
}) => {
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        setError(null)
        blob.arrayBuffer()
            .then((buffer) => {
                if (cancelled) {
                    return
                }
                const geom = isPly(fileName, blob.type)
                    ? new PLYLoader().parse(buffer)
                    : new STLLoader().parse(buffer)
                geom.computeVertexNormals()
                setGeometry(geom)
            })
            .catch(() => {
                if (!cancelled) {
                    setError('No se pudo leer el mesh')
                    setGeometry(null)
                }
            })
        return () => {
            cancelled = true
            setGeometry((prev) => {
                prev?.dispose()
                return null
            })
        }
    }, [blob, fileName])

    if (error) {
        return null
    }
    if (!geometry) {
        return null
    }

    return (
        <Center>
            <mesh geometry={geometry}>
                <meshStandardMaterial
                    color="#e8eef5"
                    metalness={0.05}
                    roughness={0.45}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </Center>
    )
}

const ScanViewer = ({ blob, fileName, className }: ScanViewerProps) => {
    const empty = useMemo(() => !blob, [blob])

    return (
        <div
            className={
                className ||
                'h-72 w-full rounded-lg border border-gray-200 bg-slate-950/90 dark:border-gray-700'
            }
        >
            {empty ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    Selecciona un scan para visualizarlo en 3D
                </div>
            ) : (
                <Canvas camera={{ position: [0, 20, 40], fov: 45 }}>
                    <color attach="background" args={['#0b1220']} />
                    <ambientLight intensity={0.55} />
                    <directionalLight position={[10, 20, 10]} intensity={1.1} />
                    <Suspense fallback={null}>
                        {blob && (
                            <MeshFromBlob blob={blob} fileName={fileName} />
                        )}
                        <Environment preset="city" />
                    </Suspense>
                    <OrbitControls makeDefault enableDamping />
                </Canvas>
            )}
        </div>
    )
}

export default ScanViewer
