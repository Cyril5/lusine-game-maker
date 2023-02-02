import React, { Component, useEffect, useRef } from 'react'

import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Renderer } from '../engine/Renderer';


const Canvas = (props : any)=> {
    
    const canvasStyle = {
        width: "100%",
        height: "100%",
    }
    
    const canvasRef = useRef(null);

    
    //Renderer.getInstance()?.init(canvasRef.current);
    
    // quand le composant est monté
    useEffect(() => {
        
        alert("engine canvas");
           //alert("TODO : Remove init engine 2nd call");
   
           new Renderer();
   
       }, []);

        // return <canvas id="canvasRender" style={this.canvasStyle} ref={canvasRef} {...props}></canvas> 
        return (<>
        <canvas id="canvasRender" style={canvasStyle}></canvas>
        </>  )
    
    

    // return <canvas id="canvasRender" style={canvasStyle} ref={canvasRef} {...props}></canvas>
}
export default Canvas