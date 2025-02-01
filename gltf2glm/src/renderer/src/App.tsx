/*
BLENDER peut exporter les extras (metadata) des fichiers glb mais pas l'exporteur gltf/glb de C4D
BABYLONJS importe bien et exporte bien les extras 
*/

import { useEffect, useRef, useState } from "react";

import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

import * as BABYLON from 'babylonjs';
import "@babylonjs/loaders";
// Enable GLTF/GLB loader (side-effects)
import "@babylonjs/loaders/glTF";

import { GLTF2Export } from '@babylonjs/serializers/glTF';
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader.js";
import { SceneSerializer } from "@babylonjs/core/";
import { Alert, Button, Container, Row } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// ES6 / TypeScript Import
import ShortUniqueId from 'short-unique-id';

const electron = require('electron');
const fs = require('fs');
const DELETE_ROOT_NODE = true; // true par defaut

function App(): JSX.Element {

  const [metaData, setMetaData] = useState<any>(null);
  const [showJSONError, setShowJSONError] = useState<boolean>(false);
  const currNodeRef = useRef<BABYLON.Node>(null);
  const sceneRef = useRef<BABYLON.Scene>(null);

  const isJSONValid = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  }

  const handleChangeMetadata = (value) => {
    if (isJSONValid(value)) {
      const json = JSON.parse(value);
      currNodeRef.current!.metadata = json;
      setMetaData(json);
      setShowJSONError(false);
    } else {
      setShowJSONError(true);
    }
  }

  useEffect(() => {

    const canvas = document.getElementById("renderCanvas"); // Get the canvas element
    const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
    sceneRef.current = new BABYLON.Scene(engine);

    // Creates a light, aiming 0,1,0 - to the sky
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), sceneRef.current);
    // Dim the light a small amount - 0 to 1
    light.intensity = 0.7;
    light.doNotSerialize = true;

    // Creates and positions a free camera
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), sceneRef.current);
    camera.doNotSerialize = true;
    // Targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());
    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    const inspector = sceneRef.current.debugLayer;
    inspector.show().then(() => {
      inspector.onSelectionChangedObservable.add((selectedObject) => {
        currNodeRef.current = selectedObject;
        setMetaData(selectedObject.metadata);
      })
    });

    const os = require('os');
    const path = require('path');
    const documentsPath = os.homedir() + '\\Documents\\Lusine Game Maker\\MonProjet';
    let modelsDirectory = path.resolve(documentsPath, 'Game');

    electron.ipcRenderer.invoke('dialog:open').then((file) => {

      console.log(file.filePaths[0]);

      try {

        if (file.filePaths[0].split('.').pop() == 'gltf') {
          fs.readFile(file.filePaths[0], "utf8", (error, data) => {
            if (error) {
              electron.ipcRenderer.invoke('show-error', error);
              console.error(error);
              return;
            }
            const uid = new ShortUniqueId({ length: 10 });
            // ajout des identifiant unique dans les extras de chaque nœud
            const json = JSON.parse(data);
            json.nodes.forEach((element) => {
              if (!element.extras) {
                element.extras = { "UUID": 0 };
              }
              element.extras.UUID = uid.rnd();
            });

            //Write UUID nodes into gltf file
            fs.writeFile(file.filePaths[0], JSON.stringify(json), (error) => {
              if (error) {
                electron.ipcRenderer.invoke('show-error', error);
                console.error(error);
                return;
              }
              // Puis on importe la scene
              loadScene(file.filePaths[0]);
            });

          });
        } else {
          //glb
          loadScene(file.filePaths[0]);
        }
      } catch (error) {

      }

    });

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
      sceneRef.current!.render();
    });
    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
      engine.resize();
    });

    // Nettoyage lors du démontage du composant
    return () => {
      engine.dispose();
    }
  }, []);

  let rootNode;
  const processMesh = (mesh,sceneModel)=>{

    if (rootNode && mesh.parent == rootNode && DELETE_ROOT_NODE) {
      mesh.parent = null;
    }

    if (!mesh.metadata || !mesh.metadata.gltf || !mesh.metadata.gltf.extras) {
      return;
    }

    if (mesh.metadata.gltf.extras.uniqueId) {
      mesh.uniqueId = mesh.metadata.gltf.extras.uniqueId;
    }
    // remplacer les mesh qui ont des instances
    if (mesh.metadata.gltf.extras.instanceRefUID) {
      // convertir en instancedMesh
      const source = sceneModel.getMeshByUniqueId(mesh.metadata.gltf.extras.instanceRefUID);
      if (!source) {
        console.error("Source not found: ", mesh.metadata.gltf.extras.instanceRefUID);
        return;
      }

      //if(mesh.metadata.gltf.extras.instanceRefUID == 10) {
        const instance = source.instantiateHierarchy(null,{doNotInstantiate : false});
        instance.name = "Instance_" + source!.name + " " + mesh.uniqueId;
        instance.setParent(mesh.parent);
        instance.position = mesh.position;
        instance.rotation = mesh.rotation;
        instance.scaling = mesh.scaling;
        mesh.dispose();
      //}
      // instance.uniqueId = mesh.metadata.gltf.extras.uniqueId;
    }
  }

  const loadScene = (filename: string) => {

    let rootNodeFound = true;
    // TODO : A remplacer par deserialize puisque le contenu de la scène est récupéré lorsqu'on lit le fichier gltf
    SceneLoader.Append("file://" + filename, "", sceneRef.current, function (sceneModel) {

      rootNode = sceneModel.getNodeById("__root__"); // seulement pour les fichiers gltf ou glb
      rootNodeFound = rootNode;
      try {
        let index = 0;
        if(rootNodeFound) {
            rootNode!.getChildren(undefined, false).forEach((mesh) => {
                processMesh(mesh,sceneModel);
              index++;
            });
        }else{
          sceneModel.meshes.forEach((mesh)=>{
            processMesh(mesh,sceneModel);
          });
        }

        if(DELETE_ROOT_NODE && rootNodeFound) {          
          rootNode!.dispose();
        }

        writeInstancesExtras();

      } catch (error) {
        console.error(error);
        electron.ipcRenderer.invoke('show-error', error);
      }

    }, null, (scene, message, exception) => {
      console.error("Error loading model:", message, exception);
    });
  }

  const exportToLGM = (): void => {

    const fs = require('fs');

    // todo : ouvrir le selecteur de fichier pour enregistrer la scene
    // (à voir) si on garde les images base64 stocké dans le fichier
    electron.ipcRenderer.invoke('dialog:exportLGM').then((file) => {
      try {
        const serializedScene = SceneSerializer.Serialize(sceneRef.current!);
        console.log(serializedScene.meshes);
        serializedScene.transformNodes.forEach(tn => {

          if (!tn.metadata || !tn.metadata.gltf || !tn.metadata.gltf.extras) {
            return;
          }
          const extras = tn.metadata.gltf.extras; // on récupère les extras du noeud avant de les mettre directement dans le metadata du noeud
          tn.metadata = { ...extras };
          console.log(tn.metadata);
        });

        fs.writeFileSync(file.filePath, JSON.stringify(serializedScene));
        console.log(serializedScene);
      } catch (error) {
        console.error(error);
      }
    });

  }

  const addGltfExtrasToNode = (node: BABYLON.Node) => {
    if (!node.metadata) {
      node.metadata = {};
    }
    if (!node.metadata.gltf) {
      node.metadata.gltf = {};
    }
    if (!node.metadata.gltf.extras) {
      node.metadata.gltf.extras = {};
    }
  }

  const writeInstancesExtras = () => {
    sceneRef.current!.getNodes().forEach((node) => {
      node.getChildMeshes().forEach((mesh) => {
        console.log(mesh.name + " : " + mesh.isAnInstance);
        if (mesh.isAnInstance) {
          addGltfExtrasToNode(mesh);
          const instancedMesh = mesh as BABYLON.InstancedMesh;
          addGltfExtrasToNode(instancedMesh.sourceMesh);
          instancedMesh.sourceMesh.metadata.gltf.extras["uniqueId"] = instancedMesh.sourceMesh.uniqueId;
          mesh.metadata.gltf.extras["uniqueId"] = mesh.uniqueId;
          mesh.metadata.gltf.extras.instanceRefUID = instancedMesh.sourceMesh.uniqueId;
        }
      });
    })
  }

  const exportToGLB = (): void => {

    writeInstancesExtras();

    GLTF2Export.GLBAsync(sceneRef.current, "fileName").then((glb) => {
      glb.downloadFiles();
    });
  }

  // TODO : remplacer fileName par le nom du fichier gltf
  const exportToGLTF = (): void => {

    writeInstancesExtras();

    GLTF2Export.GLTFAsync(sceneRef.current, "fileName").then((gltf) => {

      let duplicatesCount = new Map<string, number>();
      let abord = false;

      // Ajout des extras metadata au gltf si il a des informations de gameObject
      // TODO : Il faut retrouver le noeud correspondant à celui dans le gltf
      const gltfJson = JSON.parse(gltf.glTFFiles["fileName.gltf"]);

      sceneRef.current!.getNodes().forEach((node) => {

      });

      console.log(sceneRef.current!.getNodes());

      // gltfJson.nodes.forEach((element) => {
      //   if (!sceneRef.current!.getNodeByName(element.name)!.metadata) {
      //     element["extras"] = sceneRef.current!.getNodeByName(element.name)!.metadata;
      //   }
      // });

      if (abord) {
        return;
      }

      // Parcourir les nœuds et détecter les doublons
      gltfJson.nodes.forEach(element => {
        //   if (!duplicatesCount.has(element.name)) {
        //     // Le nom apparaît pour la première fois, on initialise le compteur à 1
        //     duplicatesCount.set(element.name, 1);
        //   } else {
        //     // Le nom est déjà présent, on incrémente le compteur
        //     let count = duplicatesCount.get(element.name)!;
        //     duplicatesCount.set(element.name, count + 1);
        //     element.name = `${element.name}_${count}`;  // Ajouter le suffixe avec le compteur
        //   }
      });
      console.log(gltfJson.nodes);
      gltf.glTFFiles["fileName.gltf"] = JSON.stringify(gltfJson);
      gltf.downloadFiles();
    });
  }

  function addMetaGameObject(event): void {
    currNodeRef.current!.metadata["gameObjectId"] = currNodeRef.current!.uniqueId;
  }

  function addGameObjectNode(event): void {
    const transformNode = new BABYLON.TransformNode('GameObject');
    transformNode.metadata = {};
    transformNode.metadata["gameObjectId"] = transformNode.uniqueId;
  }

  function addBox(event): void {
    BABYLON.MeshBuilder.CreateBox('Cube',{height: 1, width: 1, depth: 1});
  }

  function addBoxColliderComponent(event): void {
    const components = currNodeRef.current!.metadata.components;
    if(!components)
      currNodeRef.current!.metadata.components = [];
    components.push({type:"BoxCollider"});
  }

  function addFSMComponent(event): void {
    const fsm = currNodeRef.current!.metadata.finiteStateMachines;
    if(!fsm)
      currNodeRef.current!.metadata.finiteStateMachines = [];
    fsm.push({states: []});
  }

  return (
    <>
      <div className="div">
          <Button onClick={addMetaGameObject}>Convertir en GameObject</Button>
          <Button onClick={addGameObjectNode}>(+) GameObject</Button>
          <Button onClick={addBox}>Cube</Button>
          {/* <button onClick={exportToGLTF}>Exporter en GLTF</button> */}
          <Button onClick={exportToGLB}>Exporter en GLB</Button>
          <Button onClick={exportToLGM}>Exporter en LGM</Button>
      </div>
      <canvas id="renderCanvas"></canvas>
      <Container>
        <Row>
          <div className="components-btn-list">
            <Button onClick={addBoxColliderComponent}>-{'>'}BoxCollider</Button>
            <Button onClick={addFSMComponent}>-{'>'}FSM</Button>
          </div>
        </Row>
        <CodeMirror value={JSON.stringify(metaData, null, 2)} onChange={handleChangeMetadata} height="250px"
          theme="dark" options={{
            mode: { name: "javascript", json: true },
            lineNumbers: true,
          }}
        />
        <Alert show={showJSONError} variant='danger'>JSON non valide !</Alert>
      </Container>
    </>
  )
}

export default App
