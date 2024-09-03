import { useEffect, useRef, useState } from "react";

import CodeMirror from '@uiw/react-codemirror';
// import { Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';

import * as BABYLON from 'babylonjs';
import "@babylonjs/loaders";
// Enable GLTF/GLB loader (side-effects)
import "@babylonjs/loaders/glTF";

import { GLTF2Export, IExportOptions } from '@babylonjs/serializers/glTF';
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader.js";
import { SceneSerializer } from "@babylonjs/core/";
import { Container, Row } from 'react-bootstrap';

const electron = require('electron');

function App(): JSX.Element {
  
  const [metaData, setMetaData] = useState<string>("");
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
    console.log(value);
    if (isJSONValid(value)) {
      currNodeRef.current!.metadata = JSON.parse(value);
    }
    setMetaData(value);
  }

  useEffect(() => {

    const canvas = document.getElementById("renderCanvas"); // Get the canvas element
    const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
    sceneRef.current = new BABYLON.Scene(engine);

    // Creates a light, aiming 0,1,0 - to the sky
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), sceneRef.current);
    // Dim the light a small amount - 0 to 1
    light.intensity = 0.7;

    // Built-in 'ground' shape.
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, sceneRef.current);

    BABYLON.CreateBox("box", { width: 1, height: 1, depth: 1 }, sceneRef.current);


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
        setMetaData(JSON.stringify(selectedObject.metadata));
      })
    });

    const os = require('os');
    const path = require('path');
    const documentsPath = os.homedir() + '\\Documents\\Lusine Game Maker\\MonProjet';
    let modelsDirectory = path.resolve(documentsPath, 'Game');
    

    electron.ipcRenderer.invoke('dialog:open').then((file) => {
      SceneLoader.Append("file://" + file.filePaths[0], "", sceneRef.current, function (sceneModel) {
        
        const rootNode = sceneModel.getNodeById("__root__"); // seulement pour les fichiers gltf ou glb
        
        // remplacer les mesh qui ont des instances
        rootNode!.getChildren(undefined,false).forEach((mesh) => {

          console.log(mesh.name+" "+mesh.uniqueId+" par : "+mesh.parent.name);
          
          if(mesh.parent == rootNode) {
            mesh.parent = null;
          }
          
          if(!mesh.metadata || !mesh.metadata.gltf || !mesh.metadata.gltf.extras) {
            return;
          }
  
          if(mesh.metadata.gltf.extras.uniqueId) {
            mesh.uniqueId = mesh.metadata.gltf.extras.uniqueId;
          }
          
          if(mesh.metadata.gltf.extras.instanceRefUID) {
            // convertir en instancedMesh
            const source = sceneModel.getMeshByUniqueId(mesh.metadata.gltf.extras.instanceRefUID);
  
            if(!source) {
              console.error("Source not found: ", mesh.metadata.gltf.extras.instanceRefUID);
              return;
            }
            const instance = source.createInstance("Instance_"+ source!.name +" "+ mesh.uniqueId);
            instance.uniqueId = mesh.metadata.gltf.extras.uniqueId;
            instance.setParent(mesh.parent);
            instance.position = mesh.position;
            instance.rotation = mesh.rotation;
            instance.scaling = mesh.scaling;
            mesh.dispose();
          }
        });

        rootNode!.dispose();

        writeInstancesExtras();

      }, null, (scene, message, exception) => {
        console.error("Error loading model:", message, exception);
      });
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

  const exportToLGM = (): void => {
    
    const fs = require('fs');
    
    // todo : ouvrir le selecteur de fichier pour enregistrer la scene
    // (à voir) si on garde les images base64 stocké dans le fichier
    electron.ipcRenderer.invoke('dialog:exportLGM').then((file) => {
      try {
        const serializedScene = SceneSerializer.Serialize(sceneRef.current!);
        serializedScene.transformNodes.forEach(tn => {
          
          if(!tn.metadata || !tn.metadata.gltf || !tn.metadata.gltf.extras) {
            return;
          }
          const extras = tn.metadata.gltf.extras; // on récupère les extras du noeud avant de les mettre directement dans le metadata du noeud
          tn.metadata = {...extras};
          console.log(tn.metadata);
        });
        
        fs.writeFileSync(file.filePath, JSON.stringify(serializedScene));
        console.log(serializedScene);
      } catch (error) {
        console.error(error);
      }
    });

  }

  const addGltfExtrasToNode = (node : BABYLON.Node) => {
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

  const exportToGLTF = (): void => {

    writeInstancesExtras();

    GLTF2Export.GLTFAsync(sceneRef.current, "fileName").then((gltf) => {
      gltf.downloadFiles();
    });
  }

  function addMetaGameObject(event): void {
    currNodeRef.current!.metadata["gameObjectId"] = currNodeRef.current!.uniqueId;
  }

  return (
    <>
      <Container>
        <Row>
          <button onClick={addMetaGameObject}>Convertir en GameObject</button>
          <button onClick={exportToGLTF}>Exporter en GLTF</button>
          <button onClick={exportToGLB}>Exporter en GLB</button>
          <button onClick={exportToLGM}>Exporter en LGM</button>
        </Row>
        <canvas id="renderCanvas"></canvas>
        <CodeMirror value={metaData} onChange={handleChangeMetadata} height="250px"
          theme="dark" lang="javascript"
        />
      </Container>
    </>
  )
}

export default App
