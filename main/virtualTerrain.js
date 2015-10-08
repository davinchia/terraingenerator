/*
DAVIN CHIA AND JOSEPH BUTTON

CS461 FINAL PROJECT

A HIGHLY REALISTIC WORLD IN THE BROWSER

LIBRARY FOR ALL THE VIRTUAL TILES THAT MAP TO THE REAL TERRAIN

*/


//height of water = y value * (SCALE/2) so if we want a height of -30 with a scale of 40, we set -1.5 as y
const WATER = -40;

//function that returns a hash to a large tile; we use this to find out which large tile contains the height for the x,y positon that we are
//lookig for; we later then use a different hash function to find the small tile within that large tile that contains the specific 
//height for the specific point
function getHashL2(xShift, zShift) {
    var xOrigin; var xNeg = false;
    var zOrigin; var zNeg = false;
    if (xShift < 0) {
        xNeg = true;
    }
    if (zShift < 0) {
        zNeg = true;
    }

    xShift = Math.abs(xShift);
    zShift = Math.abs(zShift);
    xOrigin = Math.floor((xShift+WIDTH*8)/(WIDTH*16+0.01)) * WIDTH*16;
    zOrigin = Math.floor((zShift+WIDTH*8)/(WIDTH*16+0.01)) * WIDTH*16;
    //following are to deal with negative large tiles
    if (xNeg) {
        xOrigin *= -1;  
    }
    if (zNeg) {
        zOrigin *= -1;
    };

    return (xOrigin + "," + zOrigin);
}


//data structure containing the water line
function waterLine(gl, width, height) { 
    this.width = width;
    this.height = height;
    this.vertices = [];
    this.texCoords = [];
    this.indices = [];
  
    //create the buffers
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var texBuffer = gl.createBuffer();
    if (!texBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }    

    //updates the water line to follow the camera around
    this.updateVertices = function(cam) {
        this.vertices = [];
        this.texCoords = [];

        var x = cam[0] - this.width/2;
        var z = cam[1] - this.width/2;

        this.vertices.push(x, this.height, z);//point and texCoord for corner
        this.texCoords.push(vec2(x,z));
        
        this.vertices.push(x+this.width, this.height, z);
        this.texCoords.push(vec2(x+this.width, z));
        
        this.vertices.push(x, this.height, z+this.width);
        this.texCoords.push(vec2(x,z+this.width));
        
        this.vertices.push(x+this.width, this.height, z+this.width);
        this.texCoords.push(vec2(x+this.width,z+this.width));
        

        //make sure correct buffer is updated
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texCoords), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(gl.a_TextCoord, 2, gl.FLOAT, false, 0, 0);      
    }

    this.draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        
        // Set the association for the position attribute
        var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*3,0);
        gl.enableVertexAttribArray(a_Position);


        this.indices = [];
        
        this.indices.push(0);
        this.indices.push(1);
        this.indices.push(2);
        this.indices.push(3);

        this.indices = new Uint16Array(this.indices);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.DYNAMIC_DRAW);  
        
        gl.uniform1i(gl.u_BumpSampler, 13);
        gl.uniform1i(gl.u_Sampler,9); 
        gl.uniform1i(gl.u_drawType, 4);
        gl.uniform1i(gl.drawType, 4);
        gl.uniform1i(gl.u_SnowSampler,5);
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, 0);
    }
}


//data structure representing the virtual terrain; topLeft is an array containing starting x,z values;
function virtualT(gl, num, width, topLeft, length) {
	this.width = width; //length of the square
	this.rows = length;    //num of rows
	this.num = num; //string hash code to reference 
	this.origin = topLeft; //topLeft of the tile; we start counting from here
	this.vertices;

	//normal initialisation
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var texBuffer = gl.createBuffer();
    if (!texBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

	//updates vertices based on the camera position; 
	//cam is array containing the positon of the camera; tiles is the hashmap containing the all the pre-computed tiles
	this.updateVertices = function(cam, tilesL, clouds) {
    	this.vertices = [];
		this.texCoords = new Array();

		
        var x = this.origin[0]+cam[0]; var z=this.origin[1]+cam[1]; var y;    //variable for various coordinates
        var xMax = x + this.width; var zMax = z + this.width;
        var step = (xMax - x)/(this.rows);
        var row = 0; var col = 0; var tile; var tileL; var tiles;
        //row
        for (; x<=xMax+0.01; x+=step) {
            //col
            for (; z<=zMax+0.01; z+=step) {  
        		tileL = tilesL[getHashL2(x, z)];  //grab the largeTile that we need information from
            		//if the tile is not created yet, create it
                    if (tileL === undefined) {
                        console.log(tilesL);
                        console.log(getHashL2(x,z));    
                        createNewLargeTileHelper(gl, getHashL2(x,z), tilesL, this.rows); 
                        tileL = tilesL[getHashL2(x, z)];
                    }

                //grab all the clouds that we need to draw
                if (clouds.indexOf(tileL.cloud) < 0) {
                    clouds.push(tileL.cloud);
                    if (tileL.cloud == undefined) {
                        console.log("undefined: " + tileL);
                    }
                }

                //find the little tile of the large tile whose information we need
                tiles = tileL.tiles;
        		tile = tiles[getHash(x,z)];
                
                //calculate the row and col of the point within the little tile
                row = Math.round(x) - Math.abs(tile.xMin);
            	col = Math.round(z) - Math.abs(tile.zMin);
            	
            	if (x < 0) {
            		row = Math.abs(tile.xMin) - Math.round(Math.abs(x));
            	}
            	if (z < 0) {
            		col = Math.abs(tile.zMin) - Math.round(Math.abs(z));
            	}
            	if (tile.xMin == 0) {
            		row = Math.round(Math.abs(x)) - tile.xMin;		
            	}
            	if (tile.zMin == 0) {
            		col = Math.round(Math.abs(z)) - tile.zMin;	
            	}

                //grab the height
            	y = tile.diamondSquare[row][col];
            	
                //lower the larger tiles slightly so that we do not see them; slight hack so that we do not have to do additional
                //computations to blend the edges since we have tiles of different resolutions
                if (this.width != WIDTH) {
                    y -= (0.4 * this.width/WIDTH);
                }


                this.vertices.push(x,y,z);  //points
				
				this.texCoords.push(vec2(x,z));//texture coords for location
                
                if (tile.normal == undefined) {
                    console.log(getHash(x,z));
                }

                if (row < 0 || row > this.rows) {
                    console.log(getHash(x,z));
                    console.log(tile.xMin + " - " + x + " = " + row);
                    console.log(row);
                }

                if (col < 0 || col > this.rows) {
                    console.log(getHash(x,z));
                    console.log(tile.zMin + " - " + z + " = " + col);
                    console.log(x + " " + z);
                }
                if (tile.normal == undefined) {
                    console.log("tile_undefined");
                }
               
                this.vertices.push(tile.normal[row][col][0],tile.normal[row][col][1],tile.normal[row][col][2]);   //normals associated with that point

            }
            z = this.origin[1]+cam[1];
        }
        
        //shift tiles to follow the camera
        z = this.origin[1]+cam[1]; x = this.origin[0]+cam[0];
        
        //following draws the water associated with the tile
        //we chose to use one large quad because it was much more efficient and had the same effect as little small quads
        this.vertices.push(x, WATER, z, 0,1,0);//point and texCoord for corner
        this.texCoords.push(vec2(x,z));

        this.vertices.push(x+this.width, WATER, z, 0,1,0);
        this.texCoords.push(vec2(x+this.width, z));
        
        this.vertices.push(x,WATER, z+this.width, 0,1,0);
        this.texCoords.push(vec2(x,z+this.width));
        
        this.vertices.push(x+this.width, WATER, z+this.width, 0,1,0);
        this.texCoords.push(vec2(x+this.width,z+this.width));

        //make sure correct buffer is updated
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texCoords),gl.DYNAMIC_DRAW);
		gl.vertexAttribPointer(gl.a_TextCoord, 2, gl.FLOAT, false,  0,0);
		gl.uniform1i(gl.u_drawType, 3);
        gl.uniform1i(gl.drawType, 3);
		gl.uniform1i(gl.u_Sampler,11);
    }

    this.updateBuffer = function() {
        //rebind in case some other buffer has be binded
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        
        // Set the association for the position attribute
        var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get storage location');
            return -1;
        }
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, FSIZE*6,0);
        gl.enableVertexAttribArray(0);
        // Set the association for the normal attribute
        var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
        if (a_Normal < 0) {
            console.log('Failed to get storage location');
            return -1;
        }
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false,  FSIZE*6, FSIZE*3);
        gl.enableVertexAttribArray(a_Normal);
	
    }

    //Skin
    this.drawSkin = function() {
        this.updateBuffer();
        //change these if we are drawing a skin
        var rows = this.rows; var cols = this.rows;

        var indices = [];

        var degenerateT = 0;

        //add the indices to be drawn
        for (var j = 1; j <= rows; j++) {
            for (var i = (j-1)*(cols+1); i < j*(cols+1); i++) {
                indices.push(i);
                indices.push(i+cols+1);
            }   
            //add degenerate triangles so we can draw the skin in one pass; we add two per col to maintain the triangle orientations
            indices.push(j*(cols+1)+cols);  
            indices.push(j*(cols+1));
            degenerateT += 2;   //account for the degenerate triangles
        }
        
    
        //console.log(indices.length);
        indices = new Uint16Array(indices);
		
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);  

        gl.uniform1i(gl.u_drawType, 3);
        gl.uniform1i(gl.drawType, 3);
        gl.uniform1i(gl.u_SnowSampler,15);
        gl.drawElements(gl.TRIANGLE_STRIP, (rows*2)*(cols+1)+degenerateT, gl.UNSIGNED_SHORT, 0);
    }
}

//wrapper object
//contains all the little tiles that make up the big tile; origin is the hash code of the tile
function LargeTile(origin, tiles, xMin, zMin, pattNum) {
	this.origin = origin;
	this.tiles = tiles;
	this.xMin = xMin;
	this.zMin = zMin;
    var originData = origin.split(",");
    this.cloud = new cloudCluster(vec3(parseInt(originData[0]),150,parseInt(originData[1])),
                    60,
                    WIDTH*16, //tile length
                    Math.max(
                        Math.abs(parseInt(originData[0]))/(WIDTH*16),
                        Math.abs(parseInt(originData[1]))/(WIDTH*16)
                        ));     //a random tile is generated whenever a we create a new LargeTile; this cloud cluster
                                //is attached to the tile and drawn whenever we are grabbing information from the LargeTile
}