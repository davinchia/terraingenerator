/*
/*
DAVIN CHIA AND JOSEPH BUTTON

CS461 FINAL PROJECT

A HIGHLY REALISTIC WORLD IN THE BROWSER

Library file for final project textured functions
*/

//function that creates the skybox from the 6 different textures
function skybox(gl, cam_coord){
	//Takes in GL and a displacement, and draws the skybox accordingly
	var x = cam_coord[0];
	var y = cam_coord[1];
	var z = cam_coord[2];
	
		
		this.Wtext_coord = new Array();

		for (var i=0; i<6; i++){
			this.Wtext_coord.push(vec2(0,0));
			this.Wtext_coord.push(vec2(0,1));
			this.Wtext_coord.push(vec2(1,0));
			this.Wtext_coord.push(vec2(0,1));
			this.Wtext_coord.push(vec2(1,0));
			this.Wtext_coord.push(vec2(1,1));
			
			}
		
		this.wall_verts= new Array();
	    var x = cam_coord[0];
		var y = cam_coord[1];
		var z = cam_coord[2];
	    
    	this.wall_verts.push(vec3(-240+x,-240+y,-240+z));
		this.wall_verts.push(vec3(-240+x,240+y,-240+z));
		this.wall_verts.push(vec3(-240+x,-240+y,240+z));
		this.wall_verts.push(vec3(-240+x,240+y,-240+z));
		this.wall_verts.push(vec3(-240+x,-240+y,240+z));
		this.wall_verts.push(vec3(-240+x,240+y,240+z));//Face 1 (1,0,0)
			
		
		this.wall_verts.push(vec3(-240+x,-240+y,240+z));
		this.wall_verts.push(vec3(-240+x,240+y,240+z));
		this.wall_verts.push(vec3(240+x,-240+y,240+z));
		this.wall_verts.push(vec3(-240+x,240+y,240+z));
		this.wall_verts.push(vec3(240+x,-240+y,240+z));
		this.wall_verts.push(vec3(240+x,240+y,240+z));//Face 2 (0,0,-1)
			
			
		this.wall_verts.push(vec3(240+x,-240+y,240+z));
		this.wall_verts.push(vec3(240+x,240+y,240+z));
		this.wall_verts.push(vec3(240+x,-240+y,-240+z));
		this.wall_verts.push(vec3(240+x,240+y,240+z));
		this.wall_verts.push(vec3(240+x,-240+y,-240+z));
		this.wall_verts.push(vec3(240+x,240+y,-240+z));//Face 3 (-1,0,0)
			
		this.wall_verts.push(vec3(240+x,-240+y,-240+z));
		this.wall_verts.push(vec3(240+x,240+y,-240+z));
		this.wall_verts.push(vec3(-240+x,-240+y,-240+z));
		this.wall_verts.push(vec3(240+x,240+y,-240+z));
		this.wall_verts.push(vec3(-240+x,-240+y,-240+z));
		this.wall_verts.push(vec3(-240+x,240+y,-240+z));//Face 4 	(0,0,1)
		
		this.wall_verts.push(vec3(-240+x,240+y,240+z));
		this.wall_verts.push(vec3(-240+x,240+y,-240+z));
		this.wall_verts.push(vec3(240+x,240+y,240+z));
		this.wall_verts.push(vec3(-240+x,240+y,-240+z));
		this.wall_verts.push(vec3(240+x,240+y,240+z));
		this.wall_verts.push(vec3(240+x,240+y,-240+z));//top
	
	
		this.wall_verts.push(vec3(-240+x,-240+y,-240+z));
		this.wall_verts.push(vec3(-240+x,-240+y,240+z));//Bottom
		this.wall_verts.push(vec3(240+x,-240+y,-240+z));
		
		
		this.wall_verts.push(vec3(-240+x,-240+y,240+z));
		this.wall_verts.push(vec3(240+x,-240+y,-240+z));	
		this.wall_verts.push(vec3(240+x,-240+y,240+z));
	
	
	this.vertBuffer = gl.createBuffer();
	if (!this.vertBuffer) {
        console.log('Failed the vert buffer object');
        return -1;
    }

	
	this.textBuffer = gl.createBuffer();
	if (!this.textBuffer) {
        console.log('Failed the index buffer object');
        return -1;
    }

       	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
 		gl.bufferData(gl.ARRAY_BUFFER, flatten(this.wall_verts), gl.STATIC_DRAW);
	    gl.bindBuffer(gl.ARRAY_BUFFER, this.textBuffer);
	    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.Wtext_coord),gl.STATIC_DRAW);
		
    this.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (this.a_Position < 0) {
        console.log('Failed to get storage location');
        return -1;
    }

    //draws the skybox
    this.draw = function(gl){
	   
    	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
	    // This time we specify the stride between entries in the buffer
	    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0,0);
	    gl.enableVertexAttribArray(0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.textBuffer);
		gl.vertexAttribPointer(gl.a_TextCoord, 2, gl.FLOAT, false,  0,0);
		gl.enableVertexAttribArray(gl.a_TextCoord);
		gl.uniform1i(gl.u_drawType, 0);
		gl.uniform1i(gl.drawType, 0);	
		
		//draw negx
		gl.uniform1i(gl.u_Sampler,1);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		//draw posz
		gl.uniform1i(gl.u_Sampler,6);
		gl.drawArrays(gl.TRIANGLES, 6, 6);
		
		// //draw posx
		gl.uniform1i(gl.u_Sampler,4);
		gl.drawArrays(gl.TRIANGLES, 12, 6);

		// //draw negz
		gl.uniform1i(gl.u_Sampler,3);
		gl.drawArrays(gl.TRIANGLES, 18, 6);
		
		// //draw posy
		gl.uniform1i(gl.u_Sampler,5);
		gl.drawArrays(gl.TRIANGLES, 24, 6);
		
		gl.uniform1i(gl.u_Sampler,2);
		gl.drawArrays(gl.TRIANGLES, 30, 6);
	}
	
}

//this was an attempt to do billboarding, it worked on its own but we were unable to get it
//to mesh with the entire world in time to submit, given our strange buffer/texture issues
//with non-Linus machines.
function billboard(gl,coord,eye,scal){
	//takes in a eye (location), and billboard location, draws a 1:1 texture
	
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);
	//these lines should go in initialize
	
	this.loc = coord;

	
	//this.verts =  new Array();
	this.tCoords = new Array();
	var rand = Math.random()*16;
	
	this.rand = vec2(Math.floor(rand%4)/4, Math.floor(rand/4)/4);
	//use up and our normal to make the other basis vectors
	
	var vertBuffer = gl.createBuffer();
		if (!vertBuffer) {
			console.log('Failed the vert buffer object');
			return -1;
		}

		var normBuffer = gl.createBuffer();
		if (!normBuffer) {
			console.log('Failed the normal buffer object');
			return -1;
		}

		var textBuffer = gl.createBuffer();
		if (!textBuffer) {
			console.log('Failed the normal buffer object');
			return -1;
		}


	
	//eye = location, tnum = texture number
	this.draw = function(gl, eye, tnum){
		this.loc = coord;
		this.verts =  new Array();
		this.tCoords = new Array();
		
		this.norm = subtract(coord,eye);
		this.norm[1]=0;//set the y component to be 0 (tree faces up)
		//now we know 2 things, and must generate our points off of it
		
		var v1 = vec3(0,1,0);
		var v2 = normalize(cross(this.norm,v1));
		
		
	
		
			// var bl = scalev(scal,subtract(subtract(this.loc,v1),v2));
			// var tl = scalev(scal,subtract(add(this.loc,v1),v2));
			// var tr = scalev(scal,add(add(this.loc,v1),v2));
			// var br = scalev(scal,add(subtract(this.loc,v1),v2));


		
		// this.verts.push(bl);
		this.verts.push(-240,-240,-240)
			this.tCoords.push(vec2(0,.25));
		// this.verts.push(tl);
		this.verts.push(-240,240,-240);	
			this.tCoords.push(vec2(0,0));
		// this.verts.push(br);\
		this.verts.push(-240, -240, 240)
			this.tCoords.push(vec2(.25,.25));
		// this.verts.push(tl);
		// this.verts.push(0, 0, 10)
		// 	this.tCoords.push(vec2(0,0));
		// // this.verts.push(br);
		// this.verts.push(0, -10, 0)
		// 	this.tCoords.push(vec2(.25,1));
		// // this.verts.push(tr);
		// this.verts.push(0, 10, 10)
		// 	this.tCoords.push(vec2(.25,0));
		//console.log(this.verts);
		var norms= new Array();
		for (var i = 0; i<36 ; i ++){
			norms.push(vec3(0,-1,0));
			
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);	
		gl.bufferData(gl.ARRAY_BUFFER, flatten(this.verts), gl.DYNAMIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);	
		gl.bufferData(gl.ARRAY_BUFFER, flatten(norms), gl.DYNAMIC_DRAW);

		var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
		if (a_Position < 0) {
			console.log('Failed to get storage location');
			return -1;
		}

		var a_Normal = gl.getAttribLocation(gl.program, 'a_Position');
		if (a_Normal < 0) {
			console.log('Failed to get storage location');
			return -1;
		}

		// This time we specify the stride between entries in the buffer
		gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0,0);
		gl.enableVertexAttribArray(a_Position);

		gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0,0);
		gl.enableVertexAttribArray(a_Normal);


		gl.bindBuffer(gl.ARRAY_BUFFER, textBuffer);

		gl.bufferData(gl.ARRAY_BUFFER, flatten(this.tCoords),gl.STATIC_DRAW);

		gl.vertexAttribPointer(gl.a_TextCoord, 2, gl.FLOAT, false,  0,0);

		gl.uniform1i(gl.u_drawType, 0);
	
		gl.uniform1i(gl.u_Sampler, 11);
		gl.uniform1i(gl.drawType, 0);
		gl.drawArrays(gl.TRIANGLES,0 , 3);
		console.log(flatten(this.verts));
	
		}
	}		



function cloud(coord, scal){
	//takes in a eye (location), and billboard location, draws a 1:1 texture
	this.loc = coord;
	
	//this.verts =  new Array();
	this.tCoords = new Array();
	var rand = Math.random()*16;
	this.scal =scal;
	this.rand = vec2(Math.floor(rand%4)/4, Math.floor(rand/4)/4);
	//use up and our normal to make the other basis vectors
	
	this.loc = coord;
	this.verts =  new Array();
	this.tCoords = new Array();
	
	this.norm = vec3(0,-1,0);
	
	var v1 = vec3(1,0,0);
	var v2 = normalize(cross(this.norm,v1));
		
	var length = Math.random() * scal + scal/2;
	var bl = vec3(this.loc[0] - length/2, this.loc[1], this.loc[2] + length/2); 
	var tl = vec3(this.loc[0] - length/2, this.loc[1], this.loc[2] - length/2); 
	var tr = vec3(this.loc[0] + length/2, this.loc[1], this.loc[2] - length/2); 
	var br = vec3(this.loc[0] + length/2, this.loc[1], this.loc[2] + length/2);
	
	this.verts.push(bl);
		this.tCoords.push(add(this.rand,vec2(0,.25)));
	this.verts.push(tl);
		this.tCoords.push(add(this.rand,vec2(0,0)));
	this.verts.push(br);
		this.tCoords.push(add(this.rand,vec2(.25,.25)));
	this.verts.push(tl);
		this.tCoords.push(add(this.rand,vec2(0,0)));
	this.verts.push(br);
		this.tCoords.push(add(this.rand,vec2(.25,.25)));
	this.verts.push(tr);
		this.tCoords.push(add(this.rand,vec2(.25,0)));
	
	var vertBuffer = gl.createBuffer();
	if (!vertBuffer) {
		console.log('Failed the vert buffer object');
		return -1;
	}

	var textBuffer = gl.createBuffer();
	if (!textBuffer) {
		console.log('Failed the vert buffer object');
		return -1;
	}
	this.draw = function(){

		gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);	
		gl.bufferData(gl.ARRAY_BUFFER, flatten(this.verts), gl.DYNAMIC_DRAW);

		var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
		if (a_Position < 0) {
			console.log('Failed to get storage location');
			return -1;
		}

		// This time we specify the stride between entries in the buffer
		gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0,0);
		gl.enableVertexAttribArray(a_Position);

		gl.bindBuffer(gl.ARRAY_BUFFER, textBuffer);

		gl.bufferData(gl.ARRAY_BUFFER, flatten(this.tCoords),gl.STATIC_DRAW);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

		gl.vertexAttribPointer(gl.a_TextCoord, 2, gl.FLOAT, false,  0,0);

		gl.uniform1i(gl.u_drawType, 2);
		gl.uniform1i(gl.drawType, 2);

		gl.uniform1i(gl.u_Sampler,7);
		gl.uniform1i(gl.u_BumpSampler,8);
		
		gl.drawArrays(gl.TRIANGLES,0 , 6);
	}
}	

//function to create textures; this is essentially our skybox function; we are piecing together 6 textures to create a skybox
function initializeSkyTexture(gl, textureid, filename, side) {
    //pretty much verbatim...
    return new Promise(function(resolve, reject){
       var texture = gl.createTexture();
		
        var image = new Image();
    
    	//we have normal initialisation of the textures are in class
        image.onload = function(){
            
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            gl.activeTexture(gl.TEXTURE0+textureid);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

			
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);            
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); 
			
            resolve();
        }
        
        
        image.onerror = function(error){
            reject(Error(filename));
        }
    
        image.src = filename; 
    });
}

//this is used to load all the other textures
function initializeTexture(gl, textureid, filename) {
    
    return new Promise(function(resolve, reject){
       	var texture = gl.createTexture();

       	var image = new Image();
    
    	//normal texture loading
        image.onload = function(){
            
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
            gl.activeTexture(gl.TEXTURE0 + textureid);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
            resolve();
        }
        
        
        image.onerror = function(error){
            reject(Error(filename));
        }
    
        image.src = filename; 
    });
}

//function creates a cloud cluster wrapper than contains many cloud childs; this is attached to a
//largeTile when the large tile is created
function cloudCluster(coord, num, tileLength, pattNum){
	//Draws 'num' small clouds over the area
	this.clust = new Array();
	this.n = num;
	
	//creates a pseudo-random pattern of clouds
	if (pattNum%4 != 0) {
		for (var i =1; i<=num; i++){
			
			var loc = vec3(coord[0]+Math.random()*(tileLength-num)-tileLength/2, 
							coord[1]- (i/num)*30 - (pattNum%4) *31, 
							coord[2]+Math.random()*(tileLength-num)-tileLength/2);
			
			this.clust.push(new cloud(loc, num));	//cloud is scaled according to the size of the cloud cluster
			
		}
	
	}	

	//draws the clouds
	this.draw = function(){
		for(var i = 0; i<this.n; i++){
			this.clust[i].draw();
		}
	}
	
}

// //push down position, life, velocity and use that to calculate the particles
// //creates a rain cloud over the user; this uses a unit circle to make the rain seem genuine
function particle_cloud2(size, radius, height, cycle){

	this.particles = new Array();
	
	this.radius = radius;
	this.height = height;
	this.cycle = cycle;

	this.verts = new Array();
	this.texts = new Array();
	this.last;
	this.current = 0;

	var vertBuffer = gl.createBuffer();
	if (!vertBuffer) {
		console.log('Failed the vert buffer object');
		return -1;
	}

	var textBuffer = gl.createBuffer();
	if (!textBuffer) {
		console.log('Failed the vert buffer object');
		return -1;
	}

	//Create the list of particles and push to shaders position, velocity 
	for (var i =0 ; i<size ; i++){
		var angle = radians(Math.random() * 360);
		var radius = Math.random() * this.radius;
		var heightOffset = Math.random() * this.height/2;

		this.verts.push(Math.cos(angle) * radius, this.height - heightOffset, Math.sin(angle) * radius);	//location as defined by a unit circle
		this.texts.push(0, Math.random());	//we use random to generate a random vector which serves as acceleration
	}

	//send down to be processed later
	gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);	
	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.verts), gl.DYNAMIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, textBuffer);	
	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texts), gl.DYNAMIC_DRAW);

	//send down initial time
	this.last = Date.now();

	this.updateBuffers = function() {
		gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);	

		var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
		if (a_Position < 0) {
			console.log('Failed to get storage location');
			return -1;
		}
		
		gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(a_Position);

		var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
		if (a_Normal < 0) {
			console.log('Failed to get storage location');
			return -1;
		}
		
		//this attribute is not used; it is there because we are using one shader
		gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(a_Normal);

		gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
		//we substitute textCoord for the velocity; we actually only need the velocity, but again, we are grabbing the last position
		//because the shader requires it
		gl.vertexAttribPointer(gl.a_TextCoord, 2, gl.FLOAT, false, 0, 0);
		gl.uniform1i(gl.u_drawType, 1);
		gl.uniform1i(gl.drawType, 1);	
	}

	//cam is a vec3 that allows the rain to follow the user
	this.updateTime = function(cam) {
		this.updateBuffers();
		this.current += (Date.now() - this.last)/1000;
		//reset the timer
		if (this.current > this.cycle) {
			this.current = 0;
		}
		gl.uniform3fv(gl.u_camPos, cam);
		gl.uniform1f(gl.u_time, this.current);
		gl.drawArrays(gl.POINTS, 0, size);
		this.last = Date.now();
	}
}