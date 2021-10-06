import * as THREE from '../three/build/three.module.js';
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from '../three/examples/jsm/loaders/FBXLoader.js';
import { TWEEN } from '../three/examples/jsm/libs/tween.module.min.js';
import {
    CSS2DRenderer,
    CSS2DObject
} from '../three/examples/jsm/renderers/CSS2DRenderer.js'
// scene field

let scene, renderer, camera, orbitcontrol;
let cameraBasePosition;
let cameraTargetPosition;
let cameraSelectedObjectPosition;
let isMoovingCamera;
let currentCameraTarget;

//let transformControls;

// model field

let model, mainmodel, ingectionSyringeModel, needle1Model,
    needle2Model, box, form, manual, formcup,
    plangerCap, needleCase, needleCap, selectedObject, armatur;
let basePos, baseBoxPos, baseSelectedRot;
let injectorGlass;
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(2048);
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);

const glassMaterial = new THREE.MeshPhysicalMaterial({
    metalness: 0.3,
    roughness: 0.2,
    envMap: cubeRenderTarget.texture,
    //refractionRatio: 0.95,
    transparent: true,
    opacity: 0.4,
    transmission: 0.1,
    side: THREE.FrontSide,
    clearcoat: 1.0,
    clearcoatRoughness: 0.39
});

const formMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x343434,
    transmission: 0.5,
    opacity: 0.5,
    metalness: 0.8,
    transparent: true,
    roughness: 0,
    envMap: cubeRenderTarget.texture,
    envMapIntensity: 1,
    depthWrite: false,
});
let isFormOpacityIn = false, isFormOpacityOut = false;
let opacityDelay = 0.01;

// animation field

let skeleton, mixer, clock;
let scene_action;
let isOpenPackageAnimate = false, isPrepareAnimate = false, isAnimate = false;
let timer_delta;
let isTime = false;
let tempTime;
let timedelta = 0;
let isRebase = false;
let openPackageAnimationTime = 8.2;
let prepareAnimationTime = 2.499;
let isBoxAnimation = false;

// ui

let progressBar;
let labelRenderer;
let injectorLabel, needle1Label, needle2Label;
const labelRendererEl = document.getElementById("renderer");

// app field

let isLoader = true;
const container = document.querySelector('.container');
var mesh = [];
let stepindeex = 0;



init();



function init() {


    InitUIClick();

    progressBar = document.getElementById("progress");
    //openFullscreen();
    baseSelectedRot = new THREE.Vector3();

    createScene();
    //openFullscreen();
    scene.add(cubeCamera)

    const fbxLoader = new FBXLoader()
    model = fbxLoader.load(
        'models/Restylane4.fbx',
        (root) => {
            root.scale.set(60, 60, 60)
            scene.add(root);
            mainmodel = root;
            //console.log(dumpObject(root).join('\n'));
            skeleton = new THREE.SkeletonHelper(root);
            skeleton.visible = false;
            scene.add(skeleton);

            const clips = root.animations;
            //console.log(clips);
            mixer = new THREE.AnimationMixer(root);

            scene_action = mixer.clipAction(clips[0]);

            root.traverse(function (child) {
                mesh.push(child);

                if (child.name == "Box" && !box) {
                    box = child;
                }
                if (child.name == "Armature") {
                    armatur = child;

                    baseBoxPos = new THREE.Vector3();
                    baseBoxPos.x = child.position.x;
                    baseBoxPos.y = child.position.y;
                    baseBoxPos.z = child.position.z;
                }

                if (child.name == "Injector_t") {
                    ingectionSyringeModel = child;
                }
                if (child.name == "Needle2_t") {
                    needle2Model = child;
                }
                if (child.name == "Needle_t") {
                    needle1Model = child;
                }

                if (child.isMesh) {
                    if (child.name == "Form") {
                        form = child;
                        child.material = formMaterial;
                        form.position.z = form.position.z + 0.001;
                    }
                    if (child.name == "manual") {
                        manual = child;
                    }

                    if (child.name == "FormCap") {
                        formcup = child;
                        formcup.position.z = formcup.position.z + 0.001;
                    }
                    if (child.name == "plungerCap") {
                        plangerCap = child;
                    }

                    if (child.name == "NeedleCase") {
                        needleCase = child;
                        child.material = glassMaterial;
                    }

                    if (child.name == "NeedleCap") {
                        needleCap = child;
                        child.material = glassMaterial;
                    }

                    if (child.name == "InjectorGlass") {
                        child.material = glassMaterial;
                        injectorGlass = child;
                        //child.material = glassInFormMaterial;
                    }

                    if (child.name == "NeedleCase2Glass") {
                        child.material = glassMaterial;
                    }
                }
            });

            cameraBasePosition.x = camera.position.x;
            cameraBasePosition.y = camera.position.y;
            cameraBasePosition.z = camera.position.z;

            const injectorImg = document.createElement('img');
            injectorImg.className = 'label';
            injectorImg.src = 'images/label_injector.svg';
            injectorImg.style.marginTop = '-1em';
            injectorLabel = new CSS2DObject(injectorImg);
            injectorLabel.position.set(0, 0, 0);
            injectorGlass.add(injectorLabel);

            const needle1Img = document.createElement('img');
            needle1Img.className = 'label';
            needle1Img.src = 'images/label_needle.svg';
            needle1Img.style.marginTop = '-1em';
            needle1Label = new CSS2DObject(needle1Img);
            needle1Label.position.set(0, 0, 0);
            needle1Model.add(needle1Label);

            const needle2Img = document.createElement('img');
            needle2Img.className = 'label';
            needle2Img.src = 'images/label_needle.svg';
            needle2Img.style.marginTop = '-1em';
            needle2Label = new CSS2DObject(needle2Img);
            needle2Label.position.set(0, 0, 0);
            needle2Model.add(needle2Label);

            switchLabel(false);

            update();
        },
        (xhr) => {
            //console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            progressBar.style.width = ((xhr.loaded / xhr.total) * 90) + "%";
        },
        (error) => {
            console.log(error)
        }
    );

    window.addEventListener('resize', onWindowResize, false)

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function update() {
        mixer.update(clock.getDelta());
        requestAnimationFrame(update)
    }

    function animate() {
        if (isLoader && box) {
            if (box.material.map.image != null) {
                isLoader = false;
                progressBar.style.width = 100 + "%";
                //console.log("switch");
                document.getElementById('loaderPage').style.display = "none";
                document.getElementById('openPackageButton').style.display = "block";
            }

        }

        opacityMeshesStatus();

        mooveCameraToTarget();
        requestAnimationFrame(animate);
        orbitcontrol.update();
        TWEEN.update();
        labelRenderer.render(scene, camera);
        renderer.render(scene, camera);



    }
    animate();

}

// created base configurations for scene
function createScene() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(-35, 20, 17);
    camera.lookAt(0, 1, 0);
    cameraBasePosition = new THREE.Vector3();
    cameraTargetPosition = new THREE.Vector3(3, 8, -17);
    cameraSelectedObjectPosition = new THREE.Vector3(3, 8, -10);

    document.addEventListener('mousedown', onDocumentMouseDown, false);

    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color("#CDE3F3");
    scene.fog = new THREE.Fog("#CDE3F3", 20, 80);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRendererEl.appendChild(labelRenderer.domElement);

    //OrbitControls
    orbitcontrol = new OrbitControls(camera, labelRenderer.domElement);
    orbitcontrol.update();
    orbitcontrol.maxPolarAngle = Math.PI / 2.5;
    //orbitcontrol.minPolarAngle = Math.PI / 3;
    orbitcontrol.enablePan = false;
    orbitcontrol.dampingFactor = 0.1;
    orbitcontrol.enableDamping = true;
    orbitcontrol.minDistance = 10;
    orbitcontrol.maxDistance = 25;
    orbitcontrol.autoRotate = true;
    orbitcontrol.autoRotateSpeed = 0.5;

    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.AmbientLight(color, intensity);
    scene.add(light);

    /*const hemiLight = new THREE.HemisphereLight( "#CDE3F3", 0xffffff, 0.8 );
    hemiLight.position.set( 0, 20, 0 );
    scene.add( hemiLight );*/
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(- 3, 10, - 10);
    //dirLight.target.position.set(0, 0, 0);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = - 2;
    dirLight.shadow.camera.left = - 2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    scene.add(dirLight);

    //const helper = new THREE.DirectionalLightHelper(dirLight);
    //scene.add(helper);

    // ground
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = - Math.PI / 2;
    mesh.position.y = -20;
    mesh.receiveShadow = true;
    scene.add(mesh);
}

// write object structer to console
function dumpObject(obj, lines = [], isLast = true, prefix = '') {
    const localPrefix = isLast ? '└─' : '├─';
    lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    const lastNdx = obj.children.length - 1;
    obj.children.forEach((child, ndx) => {
        const isLast = ndx === lastNdx;
        dumpObject(child, lines, isLast, newPrefix);
    });
    return lines;
}

function startOpenPackageAnimation() {
    timer_delta = openPackageAnimationTime;

    scene_action.reset()
    scene_action.timeScale = 1;
    scene_action.setLoop(THREE.LoopOnce);
    scene_action.clampWhenFinished = true;
    manual.visible = true;
    scene_action.play();
    isAnimate = true;
    isOpenPackageAnimate = true;

}

function endOpenPackageAnimation() {
    startSecondStep();
    setMainDefaultPosition(cameraTargetPosition);
}

function reversOpenPackageAnimation() {
    timer_delta = openPackageAnimationTime;//6.6 + 1.6;

    scene_action.time = openPackageAnimationTime;
    scene_action.paused = false;
    scene_action.timeScale = -1;
    scene_action.setLoop(THREE.LoopOnce);



    isAnimate = true;
    isOpenPackageAnimate = true;
    isRebase = true;

    manual.visible = false;
    formcup.visible = false;
    box.visible = false;
    form.visible = false;
}

function startPrepareAnimation() {
    timer_delta = prepareAnimationTime;

    //scene_action.reset()
    scene_action.time = openPackageAnimationTime;
    scene_action.timeScale = 1;
    scene_action.setLoop(THREE.LoopOnce);
    scene_action.clampWhenFinished = true;
    stepindeex = 2;

    scene_action.paused = false;


    needle2Model.visible = false;
    plangerCap.visible = false;
    needleCase.visible = false;
    needleCap.visible = false;

    isAnimate = true;
    isPrepareAnimate = true;
    switchOrbitController(false);

    document.getElementById("prepareButton").style.display = "none";
    document.getElementById("backButton").style.display = "none";
}

function reversPrepareAnimation() {
    timer_delta = prepareAnimationTime;

    scene_action.paused = false;
    scene_action.timeScale = -1;
    scene_action.setLoop(THREE.LoopOnce);

    isAnimate = true;
    isPrepareAnimate = true;

    scene_action.paused = false;
    document.getElementById("full_injector_info").style.display = "none";
    document.getElementById("backButton").style.display = "none";
}

function endReversPrepareAnimation() {
    needle2Model.visible = true;
    plangerCap.visible = true;
    needleCase.visible = true;
    needleCap.visible = true;

    isRebase = false;

    startSecondStep();
    switchOrbitController(true);
}

function endPrepareAnimation() {
    document.getElementById("backButton").style.display = "block";
    document.getElementById("full_injector_info").style.display = "block";
    switchOrbitController(true);
    orbitcontrol.autoRotate = true;
}

function startSecondStep() {
    document.getElementById("backButton").style.display = "block";
    document.getElementById("prepareButton").style.display = "block";
    switchLabel(true);
    stepindeex = 1;
}


function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}



function render(time) {
    time *= 0.001;  // convert to seconds

    if (isAnimate && !isTime) {
        isTime = true;
        tempTime = time;
    }

    if (isTime) {
        timedelta = (time) - tempTime;
    }

    if (isAnimate && isOpenPackageAnimate) {
        if (isRebase) {
            if (timedelta > 1.5 && !formcup.visible) {
                swichFormOpacity(false);
                manual.visible = true
                formcup.visible = true;
            }

            if (timedelta > (timer_delta - 4.5) && manual.visible) {
                //manual.visible = false;
            }

            if (timedelta > (timer_delta - 4.0) && !isBoxAnimation) {
                isBoxAnimation = true;
                box.visible = true;
                const newBoxVector = new THREE.Vector3(0.5, 0, 0);
                animateVector3(armatur.position, baseBoxPos, {
                    duration: 2000,
                    //easing : TWEEN.Easing.Quadratic.InOut,
                    update: function (d) {
                        //console.log("Updating: " + d);
                    },
                    callback: function () {
                        //console.log("Completed", armatur.position, timedelta);
                        manual.visible = true;
                    }
                });
            }

            if (timedelta > timer_delta) {
                isAnimate = false;
                isTime = false;
                isOpenPackageAnimate = false;
                isRebase = false;
                isBoxAnimation = false;
                scene_action.paused = true;
                switchOrbitController(true);
                orbitcontrol.autoRotate = true;

                document.getElementById("openPackageButton").style.display = "block";
            }
        }
        else {
            if (timedelta > 2.0 && !isBoxAnimation) {
                isBoxAnimation = true;
                const newBoxVector = new THREE.Vector3(0.5, 0.01, 0);
                animateVector3(armatur.position, newBoxVector, {
                    duration: 2000,
                    //easing : TWEEN.Easing.Quadratic.InOut,
                    update: function (d) {
                        //console.log("Updating: " + d);
                    },
                    callback: function () {
                        //console.log("Completed", armatur.position, timedelta);
                        box.visible = false;
                    }
                });

            }
            if (timedelta > 2.5 && !isFormOpacityIn) {
                swichFormOpacity(true);
            }

            if (timedelta > 5.0 && formcup.visible) {
                formcup.visible = false;
            }

            if (timedelta > 6.625 && manual.visible) {
                manual.visible = false;
            }

            if (timedelta > timer_delta) {
                isAnimate = false;
                isTime = false;
                isOpenPackageAnimate = false;
                isBoxAnimation = false;

                scene_action.paused = true;

                endOpenPackageAnimation();
            }
        }
    }

    if (isAnimate && isPrepareAnimate) {
        if (isRebase) {
            if (timedelta > timer_delta) {
                isAnimate = false;
                isTime = false;
                isPrepareAnimate = false;

                scene_action.paused = true;

                endReversPrepareAnimation();
            }
        }
        else {

            if (timedelta > timer_delta) {
                isAnimate = false;
                isTime = false;
                isPrepareAnimate = false;

                scene_action.paused = true;

                endPrepareAnimation();
            }
        }

    }


    renderer.render(scene, camera);

    requestAnimationFrame(render);
}
requestAnimationFrame(render);

function setMainDefaultPosition(pos, completeCallback) {
    isMoovingCamera = true;
    currentCameraTarget = new THREE.Vector3(pos.x, pos.y, pos.z)
    if (completeCallback) completeCallback();
}

function InitUIClick() {

    let openPackButton = document.getElementById("openPackageButton");
    let backButton = document.getElementById("backButton");
    let prepareButton = document.getElementById("prepareButton");

    openPackButton.onclick = function () {
        switchOrbitController(false);
        orbitcontrol.autoRotate = false;
        openPackButton.style.display = "none";
        setMainDefaultPosition(cameraBasePosition, startOpenPackageAnimation);
    }

    backButton.onclick = function () {
        switchOrbitController(false);
        orbitcontrol.autoRotate = false;
        if (stepindeex == '2') {
            isRebase = true;
            setMainDefaultPosition(cameraTargetPosition, reversPrepareAnimation);
        }
        if (stepindeex == '1') {
            isRebase = true;
            backButton.style.display = "none";
            prepareButton.style.display = "none";
            switchLabel(false);
            setMainDefaultPosition(cameraBasePosition);
            stepindeex = 0;
        }
        if (stepindeex == '3' || stepindeex == '4' || stepindeex == '5') {
            backButton.style.display = "none";
            document.getElementById("needle_info").style.display = "none";
            document.getElementById("injector_info").style.display = "none";
            switchOrbitController(false);
            orbitcontrol.autoRotate = false;

            animateVector3(selectedObject.rotation, baseSelectedRot, {
                duration: 2000,
                //easing : TWEEN.Easing.Quadratic.InOut,
                update: function (d) {
                    //console.log("Updating: " + d);
                },
                callback: function () {
                    //console.log("Completed");
                    animateVector3(selectedObject.position, basePos, {
                        duration: 2000,
                        //easing : TWEEN.Easing.Quadratic.InOut,
                        update: function (d) {
                            //console.log("Updating: " + d);
                        },
                        callback: function () {
                            //console.log("Completed");
                            orbitcontrol.autoRotate = false;
                            needle1Model.visible = true;
                            needle2Model.visible = true;
                            ingectionSyringeModel.visible = true;
                            setMainDefaultPosition(cameraTargetPosition, function () {
                                startSecondStep();
                                switchOrbitController(true);
                            });
                        }
                    });
                }
            });

        }
    }
    prepareButton.onclick = function () {
        switchLabel(false);
        startPrepareAnimation();
        setMainDefaultPosition(cameraTargetPosition);
    }


}


function switchLabel(key) {
    injectorLabel.visible = key;
    needle1Label.visible = key;
    needle2Label.visible = key;
}

document.addEventListener('click', onDocumentMouseDown, false);

function onDocumentMouseDown(event) {
    let key = orbitcontrol.enabled;
    orbitcontrol.enabled = false;
    var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window
        .innerHeight) * 2 + 1, 0.5);
    onClickObject(vector, key);
}

function mooveSelectedObjAction(obj, Objcallback) {
    document.getElementById("prepareButton").style.display = "none";
    document.getElementById("backButton").style.display = "none";

    var target = (stepindeex == '5') ? (new THREE.Vector3(0, -0.03, 0)) : (new THREE.Vector3(0, 0, -0.03));
    basePos = new THREE.Vector3();
    basePos.x = obj.position.x;
    basePos.y = obj.position.y;
    basePos.z = obj.position.z;
    selectedObject = obj;

    animateVector3(selectedObject.position, target, {
        duration: 2000,
        //easing : TWEEN.Easing.Quadratic.InOut,
        update: function (d) {
            //console.log("Updating: " + d);
        },
        callback: function () {
            //console.log("Completed");
            if (Objcallback) Objcallback();
            baseSelectedRot.x = selectedObject.rotation.x;
            baseSelectedRot.y = selectedObject.rotation.y;
            baseSelectedRot.z = selectedObject.rotation.z;
            setMainDefaultPosition(cameraSelectedObjectPosition, function () {
                document.getElementById("backButton").style.display = "block";
                if (stepindeex == '3') {
                    document.getElementById("injector_info").style.display = "block";
                }
                else {
                    document.getElementById("needle_info").style.display = "block";
                }            
            });
            console.log(selectedObject.position);
            let target_rot = new THREE.Vector3(selectedObject.rotation.x + 0.2, selectedObject.rotation.y, selectedObject.rotation.z);
            animateVector3(selectedObject.rotation, target_rot, {
                duration: 2000,
                //easing : TWEEN.Easing.Quadratic.InOut,
                update: function (d) {
                    //console.log("Updating: " + d);
                },
                callback: function () {
                    //if (Objcallback) Objcallback();

                }
            });
        }
    });

}
function animateVector3(vectorToAnimate, target, options) {
    options = options || {};
    // get targets from options or set to defaults
    var to = target || THREE.Vector3(),
        easing = options.easing || TWEEN.Easing.Quadratic.In,
        duration = options.duration || 2000;
    // create the tween
    var tweenVector3 = new TWEEN.Tween(vectorToAnimate)
        .to({ x: to.x, y: to.y, z: to.z, }, duration)
        /*.easing(easing)
        .onUpdate(function(d) {
            if(options.update){ 
                options.update(d);
            }
        })*/
        .onComplete(function () {
            if (options.callback) options.callback();
        });
    // start the tween
    tweenVector3.start();
    // return the tween in case we want to manipulate it later on
    return tweenVector3;
}

let deltaX, isX = false, deltaY, isY = false, deltaZ, isZ = false;
let cameraSpeed = 0.2;
let border = 0.2;
function mooveCameraToTarget() {
    if (isMoovingCamera) {
        deltaX = camera.position.x - currentCameraTarget.x;

        if (!isX && isZ) {
            if (!(deltaX < border && deltaX > -border)) {
                if (camera.position.x > currentCameraTarget.x) {
                    camera.position.x -= cameraSpeed;
                } else if (camera.position.x < currentCameraTarget.x) {
                    camera.position.x += cameraSpeed;
                }
            } else {
                isX = true;
            }
        }


        deltaY = camera.position.y - currentCameraTarget.y;

        if (!isY && isZ) {
            if (!(deltaY < border && deltaY > -border)) {
                if (camera.position.y > currentCameraTarget.y) {
                    camera.position.y -= cameraSpeed;
                } else if (camera.position.y < currentCameraTarget.y) {
                    camera.position.y += cameraSpeed;
                }
            } else {
                isY = true;
            }
        }

        deltaZ = camera.position.z - currentCameraTarget.z;

        if (!isZ) {
            if (!(deltaZ < border && deltaZ > -border)) {
                if (camera.position.z > currentCameraTarget.z) {
                    camera.position.z -= cameraSpeed;
                } else if (camera.position.z < currentCameraTarget.z) {
                    camera.position.z += cameraSpeed;
                }
            } else {
                isZ = true;
            }
        }

        if (isX && isY && isZ) {
            isMoovingCamera = false;
            isX = false;
            isY = false;
            isZ = false;
            if (stepindeex == '1') {
                switchOrbitController(true);
            }
            if (stepindeex == '0' && isRebase) {
                reversOpenPackageAnimation();
            }
        }

    }
}
// key - true выключть объект
function swichFormOpacity(key) {
    form.transparent = true;
    if (key)
        isFormOpacityIn = true;
    else {
        form.visible = true;
        isFormOpacityOut = true;
    }
}

function opacityMeshesStatus() {

    if (isFormOpacityIn) {
        if (form.material.opacity > 0) {
            form.material.opacity -= opacityDelay;
        }
        else {
            isFormOpacityIn = false;
            form.visible = false;
            form.material.opacity = 0;
        }
    }

    if (isFormOpacityOut) {
        if (form.material.opacity < 0.4) {
            form.material.opacity += opacityDelay * 0.1;
        }
        else {
            isFormOpacityOut = false;
            form.material.opacity = 0.4;
        }
    }


}

document.addEventListener('touchstart', onTouchStart);
document.addEventListener('wheel', onMouseWheel, {
    passive: false
});

function onTouchStart(event) {
    let key = orbitcontrol.enabled;
    orbitcontrol.enabled = false;
    var vector = new THREE.Vector3((event.touches[0].clientX / window.innerWidth) * 2 - 1, -(event.touches[0].clientY / window
        .innerHeight) * 2 + 1, 0.5);
    onClickObject(vector, key);
}

function onClickObject(vector, key) {
    vector = vector.unproject(camera); // convert the coordinates of the screen into the coordinate of the three-dimensional scene
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObjects(mesh, true);
    orbitcontrol.enabled = key;
    if (stepindeex == '1') {
        if (intersects.length > 0) {
            intersects.forEach(element => {
                if ((element.object.name == "Injector" ||
                    element.object.name == "InjectorGlass" ||
                    element.object.name == "plungerCap" ||
                    element.object.name == "InjectorPlunger")
                    && stepindeex == '1') {
                    switchLabel(false);
                    stepindeex = 3;
                    needle1Model.visible = false;
                    needle2Model.visible = false;
                    switchOrbitController(false);
                    mooveSelectedObjAction(ingectionSyringeModel, function () {
                        switchOrbitController(true);
                        orbitcontrol.autoRotate = true;
                    });
                    return;
                }
                if ((element.object.name == "Needle" ||
                    element.object.name == "NeedleCase" ||
                    element.object.name == "NeedleCap")
                    && stepindeex == '1') {
                    switchLabel(false);
                    stepindeex = 4;
                    ingectionSyringeModel.visible = false;
                    needle2Model.visible = false;
                    switchOrbitController(false);
                    mooveSelectedObjAction(needle1Model, function () {
                        switchOrbitController(true);
                        orbitcontrol.autoRotate = true;
                    });
                    return;
                }
                if ((element.object.name == "NeedleCase2" ||
                    element.object.name == "NeedleCase2Glass")
                    && stepindeex == '1') {
                    switchLabel(false);
                    stepindeex = 5;
                    ingectionSyringeModel.visible = false;
                    needle1Model.visible = false;
                    switchOrbitController(false);
                    mooveSelectedObjAction(needle2Model, function () {
                        switchOrbitController(true);
                        orbitcontrol.autoRotate = true;
                    });
                    return;
                }
            });
        }
    }
}

function switchOrbitController(key) {
    orbitcontrol.enableZoom = key;
    orbitcontrol.enableRotate = key;
}
function onMouseWheel(event) {
    event.preventDefault();
}