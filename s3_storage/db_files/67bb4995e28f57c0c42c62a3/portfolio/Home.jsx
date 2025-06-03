"use client"
import React, { useState, useEffect } from 'react'

function Test (){
    const [vari, setVar] = useState(0);

    return (
        <div className="bg-yellow-800">
            <div>{vari}</div>
            <button onClick = {()=>setVar(vari+1)}>Press Me</button>

            <div className="flex bg-green-200 flex-col gap-2 border-2 border-blue-500">
                <div>Hellooo1</div>
                <div>Hellooo2</div>
                <div className="bg-gray-500">Hellooo3</div>
                <div>Hellooo4</div>
                <div>Hellooo5</div>
            </div>
        </div>
    );
}

export default Test;