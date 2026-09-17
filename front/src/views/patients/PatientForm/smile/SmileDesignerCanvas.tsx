import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber'
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
    /** 0..1 scan opacity. Lower = easier to pick teeth inside the mesh. */
    scanOpacity?: number
    /** Increment to frame the camera on the selected tooth. */
    focusNonce?: number
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
            userData={{ toothId: tooth.tooth, kind: 'tooth' }}
            onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation()
                onSelect(tooth.tooth)
            }}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation()
            }}
        >
            <meshStandardMaterial
                color={selected ? '#38bdf8' : '#f8fafc'}
                emissive={selected ? '#0ea5e9' : '#000000'}
                emissiveIntensity={selected ? 0.28 : 0}
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

/** Double-click cycles tooth hits under the cursor (front → back layers). */
const LayerPickController = ({
    selectedId,
    dragging,
    onSelectTooth,
    onFocusRequest,
}: {
    selectedId: string | null | undefined
    dragging: boolean
    onSelectTooth: (tooth: string | null) => void
    onFocusRequest: () => void
}) => {
    const { camera, gl, scene } = useThree()
    const pointer = useRef(new THREE.Vector2())
    const raycaster = useMemo(() => new THREE.Raycaster(), [])

    useEffect(() => {
        const el = gl.domElement

        const collectToothIds = (clientX: number, clientY: number) => {
            const rect = el.getBoundingClientRect()
            pointer.current.x =
                ((clientX - rect.left) / rect.width) * 2 - 1
            pointer.current.y =
                -((clientY - rect.top) / rect.height) * 2 + 1
            raycaster.setFromCamera(pointer.current, camera)
            const hits = raycaster.intersectObjects(scene.children, true)
            const toothIds: string[] = []
            for (const hit of hits) {
                let obj: THREE.Object3D | null = hit.object
                while (obj) {
                    const id = obj.userData?.toothId as string | undefined
                    if (id && !toothIds.includes(id)) {
                        toothIds.push(id)
                        break
                    }
                    obj = obj.parent
                }
            }
            return toothIds
        }

        const onDblClick = (event: MouseEvent) => {
            if (dragging) {
                return
            }
            event.preventDefault()
            const toothIds = collectToothIds(event.clientX, event.clientY)
            if (toothIds.length === 0) {
                onSelectTooth(null)
                return
            }
            const currentIndex = selectedId
                ? toothIds.indexOf(selectedId)
                : -1
            const nextId =
                toothIds[(currentIndex + 1) % toothIds.length] ?? toothIds[0]
            onSelectTooth(nextId)
            // Frame the newly picked tooth so it is not lost inside the scan.
            onFocusRequest()
        }

        el.addEventListener('dblclick', onDblClick)
        return () => {
            el.removeEventListener('dblclick', onDblClick)
        }
    }, [
        camera,
        dragging,
        gl.domElement,
        onFocusRequest,
        onSelectTooth,
        raycaster,
        scene,
        selectedId,
    ])

    return null
}

const FocusController = ({
    targetRef,
    nonce,
}: {
    targetRef: RefObject<THREE.Mesh | null>
    nonce: number
}) => {
    const { camera, controls } = useThree()
    const anim = useRef<{
        active: boolean
        t: number
        fromPos: THREE.Vector3
        toPos: THREE.Vector3
        fromTarget: THREE.Vector3
        toTarget: THREE.Vector3
    } | null>(null)

    useEffect(() => {
        if (!nonce) {
            return
        }
        const mesh = targetRef.current
        if (!mesh) {
            return
        }
        const box = new THREE.Box3().setFromObject(mesh)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const radius = Math.max(size.x, size.y, size.z, 1) * 2.8
        const offset = new THREE.Vector3(radius * 0.55, radius * 0.35, radius)
        const toPos = center.clone().add(offset)
        const orbit = controls as unknown as {
            target?: THREE.Vector3
        } | null
        const fromTarget = orbit?.target?.clone() ?? new THREE.Vector3()
        anim.current = {
            active: true,
            t: 0,
            fromPos: camera.position.clone(),
            toPos,
            fromTarget,
            toTarget: center.clone(),
        }
    }, [camera, controls, nonce, targetRef])

    useFrame((_, delta) => {
        const state = anim.current
        if (!state?.active) {
            return
        }
        state.t = Math.min(1, state.t + delta * 2.2)
        const k = 1 - Math.pow(1 - state.t, 3)
        camera.position.lerpVectors(state.fromPos, state.toPos, k)
        const orbit = controls as unknown as {
            target?: THREE.Vector3
            update?: () => void
        } | null
        if (orbit?.target) {
            orbit.target.lerpVectors(state.fromTarget, state.toTarget, k)
            orbit.update?.()
        } else {
            camera.lookAt(
                new THREE.Vector3().lerpVectors(
                    state.fromTarget,
                    state.toTarget,
                    k,
                ),
            )
        }
        if (state.t >= 1) {
            state.active = false
        }
    })

    return null
}

/** Middle-mouse drag pans in screen X/Y. Wheel scroll always zooms. */
const MiddleMousePanController = ({ enabled }: { enabled: boolean }) => {
    const { camera, gl, controls } = useThree()
    const dragging = useRef(false)
    const last = useRef({ x: 0, y: 0 })
    const right = useRef(new THREE.Vector3())
    const up = useRef(new THREE.Vector3())

    useEffect(() => {
        const el = gl.domElement

        const getOrbit = () =>
            controls as unknown as {
                target?: THREE.Vector3
                update?: () => void
                enabled?: boolean
            } | null

        const onPointerDown = (event: PointerEvent) => {
            if (!enabled || event.button !== 1) {
                return
            }
            const orbit = getOrbit()
            if (!orbit?.target || orbit.enabled === false) {
                return
            }
            dragging.current = true
            last.current = { x: event.clientX, y: event.clientY }
            el.setPointerCapture(event.pointerId)
            el.style.cursor = 'move'
            event.preventDefault()
        }

        const onPointerMove = (event: PointerEvent) => {
            if (!dragging.current) {
                return
            }
            const orbit = getOrbit()
            if (!orbit?.target) {
                return
            }
            const dx = event.clientX - last.current.x
            const dy = event.clientY - last.current.y
            last.current = { x: event.clientX, y: event.clientY }

            const distance = camera.position.distanceTo(orbit.target)
            const panScale = distance * 0.0015
            right.current.setFromMatrixColumn(camera.matrix, 0).normalize()
            up.current.setFromMatrixColumn(camera.matrix, 1).normalize()
            const offset = new THREE.Vector3()
                .copy(right.current)
                .multiplyScalar(-dx * panScale)
                .addScaledVector(up.current, dy * panScale)
            camera.position.add(offset)
            orbit.target.add(offset)
            orbit.update?.()
            event.preventDefault()
        }

        const endDrag = (event: PointerEvent) => {
            if (!dragging.current) {
                return
            }
            dragging.current = false
            if (el.hasPointerCapture(event.pointerId)) {
                el.releasePointerCapture(event.pointerId)
            }
            el.style.cursor = 'auto'
        }

        const onAuxClick = (event: MouseEvent) => {
            // Avoid middle-click default (auto-scroll) in some browsers.
            if (event.button === 1) {
                event.preventDefault()
            }
        }

        el.addEventListener('pointerdown', onPointerDown)
        el.addEventListener('pointermove', onPointerMove)
        el.addEventListener('pointerup', endDrag)
        el.addEventListener('pointercancel', endDrag)
        el.addEventListener('auxclick', onAuxClick)
        el.addEventListener('mousedown', onAuxClick)
        return () => {
            el.removeEventListener('pointerdown', onPointerDown)
            el.removeEventListener('pointermove', onPointerMove)
            el.removeEventListener('pointerup', endDrag)
            el.removeEventListener('pointercancel', endDrag)
            el.removeEventListener('auxclick', onAuxClick)
            el.removeEventListener('mousedown', onAuxClick)
        }
    }, [camera, controls, enabled, gl.domElement])

    return null
}

const SceneContent = ({
    document,
    scanGeometry,
    gizmoMode,
    editable,
    scanOpacity = 0.28,
    focusNonce = 0,
    onSelectTooth,
    onToothChange,
}: Omit<SmileDesignerCanvasProps, 'className'>) => {
    const selectedRef = useRef<THREE.Mesh | null>(null)
    const orbitRef = useRef<THREE.Object3D & { enabled?: boolean }>(null)
    const [dragging, setDragging] = useState(false)
    const [gizmoReady, setGizmoReady] = useState(0)
    const [localFocus, setLocalFocus] = useState(0)
    const selectedId = document.selectedTooth
    const combinedFocus = focusNonce + localFocus

    useEffect(() => {
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
                <group>
                    {scanGeometry && (
                        <mesh
                            geometry={scanGeometry}
                            userData={{ kind: 'scan' }}
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
                                depthWrite={scanOpacity > 0.55}
                                opacity={scanOpacity}
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
            <LayerPickController
                dragging={dragging}
                selectedId={selectedId}
                onFocusRequest={() => setLocalFocus((n) => n + 1)}
                onSelectTooth={onSelectTooth}
            />
            <FocusController nonce={combinedFocus} targetRef={selectedRef} />
            <MiddleMousePanController enabled={!dragging} />
            <OrbitControls
                ref={orbitRef}
                makeDefault
                enableDamping
                enablePan={false}
                enableZoom
                enabled={!dragging}
                mouseButtons={{
                    LEFT: THREE.MOUSE.ROTATE,
                    MIDDLE: THREE.MOUSE.PAN,
                    RIGHT: THREE.MOUSE.PAN,
                }}
            />
        </>
    )
}

const SmileDesignerCanvas = ({
    document,
    scanGeometry,
    gizmoMode = 'translate',
    editable = true,
    scanOpacity = 0.28,
    focusNonce = 0,
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
                    focusNonce={focusNonce}
                    gizmoMode={gizmoMode}
                    scanGeometry={scanGeometry}
                    scanOpacity={scanOpacity}
                    onSelectTooth={onSelectTooth}
                    onToothChange={onToothChange}
                />
            </Canvas>
        </div>
    )
}

export default SmileDesignerCanvas
