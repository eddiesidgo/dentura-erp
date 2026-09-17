import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber'
import {
    Environment,
    OrbitControls,
    TransformControls,
} from '@react-three/drei'
import * as THREE from 'three'
import type { SmileDesignDocument, ToothTransform } from '@/@types/smile'
import { createToothGeometry } from './toothTemplates'

export type GizmoMode = 'translate' | 'rotate' | 'scale'

type SmileDesignerCanvasProps = {
    document: SmileDesignDocument
    scanGeometry?: THREE.BufferGeometry | null
    gizmoMode?: GizmoMode
    editable?: boolean
    onSelectTooth: (tooth: string | null) => void
    onToothChange: (tooth: string, patch: Partial<ToothTransform>) => void
    className?: string
}

const ToothMesh = ({
    tooth,
    selected,
    meshRef,
    onSelect,
}: {
    tooth: ToothTransform
    selected: boolean
    meshRef?: RefObject<THREE.Mesh | null>
    onSelect: (tooth: string) => void
}) => {
    const geometry = useMemo(
        () => createToothGeometry(tooth.shape || 'OVAL'),
        [tooth.shape],
    )

    return (
        <mesh
            ref={selected ? meshRef : undefined}
            castShadow
            geometry={geometry}
            position={tooth.position}
            rotation={tooth.rotation}
            scale={tooth.scale}
            onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation()
                onSelect(tooth.tooth)
            }}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
                // Keep selection when starting a drag on the mesh itself.
                event.stopPropagation()
            }}
        >
            <meshStandardMaterial
                color={selected ? '#38bdf8' : '#f8fafc'}
                emissive={selected ? '#0ea5e9' : '#000000'}
                emissiveIntensity={selected ? 0.25 : 0}
                metalness={0.08}
                roughness={0.35}
            />
        </mesh>
    )
}

const SelectedGizmo = ({
    toothId,
    mode,
    meshRef,
    onToothChange,
    onDraggingChange,
}: {
    toothId: string
    mode: GizmoMode
    meshRef: RefObject<THREE.Mesh | null>
    onToothChange: (tooth: string, patch: Partial<ToothTransform>) => void
    onDraggingChange: (dragging: boolean) => void
}) => {
    const controlsRef = useRef<THREE.Object3D>(null)
    const { gl } = useThree()

    useEffect(() => {
        const controls = controlsRef.current as unknown as {
            addEventListener: (
                type: string,
                listener: (event: { value: boolean }) => void,
            ) => void
            removeEventListener: (
                type: string,
                listener: (event: { value: boolean }) => void,
            ) => void
        } | null
        if (!controls?.addEventListener) {
            return
        }

        const syncFromObject = () => {
            const object = meshRef.current
            if (!object) {
                return
            }
            onToothChange(toothId, {
                position: [
                    object.position.x,
                    object.position.y,
                    object.position.z,
                ],
                rotation: [
                    object.rotation.x,
                    object.rotation.y,
                    object.rotation.z,
                ],
                scale: [object.scale.x, object.scale.y, object.scale.z],
            })
        }

        const onDragChanged = (event: { value: boolean }) => {
            onDraggingChange(event.value)
            if (!event.value) {
                syncFromObject()
            }
        }

        controls.addEventListener('dragging-changed', onDragChanged)
        return () => {
            controls.removeEventListener('dragging-changed', onDragChanged)
        }
    }, [meshRef, onDraggingChange, onToothChange, toothId])

    return (
        <TransformControls
            ref={controlsRef as never}
            mode={mode}
            object={meshRef}
            size={0.85}
            onMouseDown={() => {
                gl.domElement.style.cursor = 'grabbing'
            }}
            onMouseUp={() => {
                gl.domElement.style.cursor = 'auto'
            }}
        />
    )
}

const SceneContent = ({
    document,
    scanGeometry,
    gizmoMode,
    editable,
    onSelectTooth,
    onToothChange,
}: Omit<SmileDesignerCanvasProps, 'className'>) => {
    const selectedRef = useRef<THREE.Mesh | null>(null)
    const orbitRef = useRef<THREE.Object3D & { enabled?: boolean }>(null)
    const [dragging, setDragging] = useState(false)
    const [gizmoReady, setGizmoReady] = useState(0)
    const selectedId = document.selectedTooth

    useEffect(() => {
        // Remount gizmo after the selected mesh ref is attached.
        setGizmoReady((n) => n + 1)
    }, [selectedId])

    useEffect(() => {
        if (orbitRef.current && 'enabled' in orbitRef.current) {
            orbitRef.current.enabled = !dragging
        }
    }, [dragging])

    return (
        <>
            <color attach="background" args={['#071018']} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[8, 16, 10]} intensity={1.15} />
            <Suspense fallback={null}>
                <group
                    onPointerMissed={() => {
                        if (!dragging) {
                            onSelectTooth(null)
                        }
                    }}
                >
                    {scanGeometry && (
                        <mesh
                            geometry={scanGeometry}
                            onClick={(event) => {
                                event.stopPropagation()
                                if (!dragging) {
                                    onSelectTooth(null)
                                }
                            }}
                        >
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
                            meshRef={
                                selectedId === tooth.tooth
                                    ? selectedRef
                                    : undefined
                            }
                            selected={selectedId === tooth.tooth}
                            tooth={tooth}
                            onSelect={onSelectTooth}
                        />
                    ))}
                </group>
                {editable && selectedId && gizmoReady > 0 && (
                        <SelectedGizmo
                            key={`${selectedId}-${gizmoMode}-${gizmoReady}`}
                            meshRef={selectedRef}
                            mode={gizmoMode || 'translate'}
                            toothId={selectedId}
                            onDraggingChange={setDragging}
                            onToothChange={onToothChange}
                        />
                    )}
                <Environment preset="apartment" />
            </Suspense>
            <OrbitControls
                ref={orbitRef}
                makeDefault
                enableDamping
                enabled={!dragging}
            />
        </>
    )
}

const SmileDesignerCanvas = ({
    document,
    scanGeometry,
    gizmoMode = 'translate',
    editable = true,
    onSelectTooth,
    onToothChange,
    className,
}: SmileDesignerCanvasProps) => {
    return (
        <div
            className={
                className ||
                'h-80 w-full rounded-lg border border-gray-200 bg-slate-950/90 dark:border-gray-700'
            }
        >
            <Canvas camera={{ position: [0, 8, 28], fov: 42 }}>
                <SceneContent
                    document={document}
                    editable={editable}
                    gizmoMode={gizmoMode}
                    scanGeometry={scanGeometry}
                    onSelectTooth={onSelectTooth}
                    onToothChange={onToothChange}
                />
            </Canvas>
        </div>
    )
}

export default SmileDesignerCanvas
