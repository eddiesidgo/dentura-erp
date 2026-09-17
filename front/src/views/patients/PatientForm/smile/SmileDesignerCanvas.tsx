import { Suspense, useMemo, useRef } from 'react'
import { Canvas, ThreeEvent } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { SmileDesignDocument, ToothTransform } from '@/@types/smile'
import { createToothGeometry } from './toothTemplates'

type SmileDesignerCanvasProps = {
    document: SmileDesignDocument
    scanGeometry?: THREE.BufferGeometry | null
    onSelectTooth: (tooth: string) => void
    className?: string
}

const ToothMesh = ({
    tooth,
    selected,
    onSelect,
}: {
    tooth: ToothTransform
    selected: boolean
    onSelect: (tooth: string) => void
}) => {
    const geometry = useMemo(
        () => createToothGeometry(tooth.shape || 'OVAL'),
        [tooth.shape],
    )

    return (
        <mesh
            geometry={geometry}
            position={tooth.position}
            rotation={tooth.rotation}
            scale={tooth.scale}
            onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation()
                onSelect(tooth.tooth)
            }}
        >
            <meshStandardMaterial
                color={selected ? '#38bdf8' : '#f8fafc'}
                metalness={0.08}
                roughness={0.35}
                emissive={selected ? '#0ea5e9' : '#000000'}
                emissiveIntensity={selected ? 0.25 : 0}
            />
        </mesh>
    )
}

const SmileDesignerCanvas = ({
    document,
    scanGeometry,
    onSelectTooth,
    className,
}: SmileDesignerCanvasProps) => {
    const groupRef = useRef<THREE.Group>(null)

    return (
        <div
            className={
                className ||
                'h-80 w-full rounded-lg border border-gray-200 bg-slate-950/90 dark:border-gray-700'
            }
        >
            <Canvas camera={{ position: [0, 8, 28], fov: 42 }}>
                <color attach="background" args={['#071018']} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[8, 16, 10]} intensity={1.15} />
                <Suspense fallback={null}>
                    <group ref={groupRef}>
                        {scanGeometry && (
                            <mesh geometry={scanGeometry}>
                                <meshStandardMaterial
                                    transparent
                                    color="#94a3b8"
                                    opacity={0.28}
                                    roughness={0.7}
                                    side={THREE.DoubleSide}
                                />
                            </mesh>
                        )}
                        {document.teeth.map((tooth) => (
                            <ToothMesh
                                key={tooth.tooth}
                                tooth={tooth}
                                selected={document.selectedTooth === tooth.tooth}
                                onSelect={onSelectTooth}
                            />
                        ))}
                    </group>
                    <Environment preset="apartment" />
                </Suspense>
                <OrbitControls makeDefault enableDamping />
            </Canvas>
        </div>
    )
}

export default SmileDesignerCanvas
