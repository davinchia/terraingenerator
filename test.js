/*
Davin Chia
CS 461, Program 6

Added features
- waterline
- distance based fog
- tiling (we start out with 9 tiled grids that slowly are removed as we move around)
- infinite tilling (pheew, took me a while!)   

*/
const FSIZE = 4;
const WIDTH = 128;

/*
 * Our standard initialization. x,y,z is the vector representing directional lighting.
 */
function initialize(x, y, z) {
    var canvas = document.getElementById('gl-canvas');
    
    // Use webgl-util.js to make sure we get a WebGL context
    var gl = WebGLUtils.setupWebGL(canvas);
    
    if (!gl) {
        alert("Could not create WebGL context");
        return;
    }
    
    // set the viewport to be sized correctly
    gl.viewport(0,0, canvas.width, canvas.height);
    // set the clear color
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    // enable depth tests
    gl.enable(gl.DEPTH_TEST);

    // create program with our shaders and enable it
    // notice that I'm adding the program as a property to the gl object
    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    // create the current transform and the matrix stack in the gl object
    gl.currentTransform = mat4();
    gl.transformStack = [];
    
    // add some methods for working with the matrix stack
    gl.push = function(){
        gl.transformStack.push(gl.currentTransform);
    }
    
    gl.pop = function(){
        gl.currentTransform = gl.transformStack.pop();
    }

    // grab the handle to the model matrix and add it to gl
    gl.u_ModelMatrix =  gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(mat4()));  //set to identity
    // grab the handle to the view matrix and add it to gl
    gl.u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    
    // Create the projection matrix and load it
    var projection = perspective(60, canvas.width/canvas.height, .1, 3000);
    gl.u_Projection = gl.getUniformLocation(gl.program, 'u_Projection');
    gl.uniformMatrix4fv(gl.u_Projection, false, flatten(projection));
    
    //set the values for all the light uniforms
    var shininess = 100.0;

    u_light_dir = gl.getUniformLocation(gl.program, 'u_light_Dir');
    gl.uniform3f(u_light_dir, x, y, z);

    u_light_ambient = gl.getUniformLocation(gl.program, 'u_light_Ambient');
    gl.uniform3f(u_light_ambient, 0.1, 0.1, 0.1);

    u_light_diffuse = gl.getUniformLocation(gl.program, 'u_light_Diffuse');
    gl.uniform3f(u_light_diffuse, 0.9, 0.9, 0.9);
    
    u_light_specular = gl.getUniformLocation(gl.program, 'u_light_Specular');
    gl.uniform3f(u_light_specular, 0.2, 0.2, 0.2);

    u_shininess = gl.getUniformLocation(gl.program, 'u_Shininess');
    gl.uniform1f(u_shininess, shininess);

    u_light_Color = gl.getUniformLocation(gl.program, 'u_light_Color');
    gl.uniform3f(u_light_Color, 1.0, 1.0, 1.0);

    return gl;
}

//gives a 2D array with length n+1
function createDS(n) {
    var array = new Array(n+1);
    for (var i = 0; i < n+1; i++) {
        array[i] = new Array(n+1);
    }
    for (var i = 0; i < n+1; i++) {
        for (var j = 0; j < n+1; j++) {
            array[i][j] = 0;
        }
    }
    return array;
}   

function createNormalArr(n) {
    var array = new Array(n+1);
    for (var i = 0; i < n+1; i++) {
        array[i] = new Array(n+1);
    }
    for (var i = 0; i < n+1; i++) {
        for (var j = 0; j < n+1; j++) {
            array[i][j] = new vec3();
        }
    }
    return array;
}

//object used to model the terrain
function HeightField(gl, xMin, xMax, zMin, zMax, lengthS) {
    //basic properties required to draw the heightField
    this.vertices = [];
    this.xMin = xMin;
    this.xMax = xMax;     
    this.zMin = zMin;
    this.zMax = zMax;   
    this.row = lengthS;
    this.col = lengthS;
    this.lengthDiamond = lengthS;   //length of side of terrain
    this.diamondSquare = createDS(this.lengthDiamond);  //array of heights
    this.normal = createNormalArr(this.lengthDiamond);  // array of normals
    this.origin = (xMin+WIDTH/2) +  "," + (zMin+WIDTH/2);   //hash key for the terrain
    this.maxHeight; //used to set the waterline

    //this allows us to easier piece the different tiles together
    this.leftRight = [];
    this.topBottom = [];

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

    //following series of functions are used to set top/bottom/left/right rows of the adjacent terrain
    this.setHeightLR = function (row) {
        for (var i = 0; i < row.length; i++) {
            this.diamondSquare[0][i] = row[i];
            this.diamondSquare[row.length-1][i] = row[i];
        }
    }

    this.setHeightTB = function (row) {
        for (var i = 0; i < row.length; i++) {
            this.diamondSquare[i][0] = row[i];
            this.diamondSquare[i][row.length-1] = row[i];
        }
    }

    //set normal on left edge using right adjacent tile
    this.setNormalsL = function(normals) {
         for (var i = 0; i < normals[0].length; i++) {
            this.normal[0][i] = normals[normals.length-1][i];
        }
    }

    //set normal on right edge using left adjacent tile
    this.setNormalsR = function(normals) {
         for (var i = 0; i < normals[0].length; i++) {
            this.normal[this.normal.length-1][i] = normals[0][i];
        }
    }

    //set normal on bottom edge using right adjacent tile
    this.setNormalsB = function(normals) {
         for (var i = 0; i < normals[0].length; i++) {
            this.normal[i][normals[0].length-1] = normals[i][0];
        }
    }

    //set normal on top edge using bottom adjacent tile
    this.setNormalsT = function(normals) {
         for (var i = 0; i < normals[0].length; i++) {
            this.normal[i][0] = normals[i][normals[0].length-1];
        }
    }


    //test function
    this.printDS = function() {
        for (var i = 0; i < this.lengthDiamond+1; i++) {
            for (var j = 0; j < this.lengthDiamond+1; j++) {
                console.log(this.diamondSquare[i][j]);
            }
        }
    }

    this.calculateNormal = function() {
        var step = (this.xMax - this.xMin)/this.row;
        var one; var two; var three; var four;    //points for each cell
        //vectors
        var a; var b; var normal;
        //add up all the normals for the vertices
        for (var i = 0; i < this.lengthDiamond; i++) {
            for (var j = 0; j < this.lengthDiamond; j++) {
                //Points: top left, top right, bottom right, bottom left
                one = new vec3(this.xMin + j*step, this.diamondSquare[i][j], this.zMin + i*step);
                two = new vec3(this.xMin + (j+1)*step, this.diamondSquare[i][j+1], this.zMin + i*step);
                three = new vec3(this.xMin + (j+1)*step, this.diamondSquare[i+1][j+1], this.zMin + (i+1)*step);
                four = new vec3(this.xMin + j*step, this.diamondSquare[i+1][j], this.zMin + (i+1)*step);
             
                //we calculate the surface normal for the 4 triangles that make up one cell, and add this vector to the
                //vertices involved; going clockwise; i, j represents the top left of each 'cell' we calculate 
                //top left
                a = subtract(four, one);
                b = subtract(two, one);
                normal = normalize(cross(a,b));
                this.normal[i][j] = add(this.normal[i][j], normal);
                this.normal[i][j+1] = add(this.normal[i][j+1], normal);
                this.normal[i+1][j] = add(this.normal[i+1][j], normal);

                //top right
                a = subtract(one, two);
                b = subtract(three, two);
                normal = normalize(cross(a,b));
                this.normal[i][j] = add(this.normal[i][j], normal);
                this.normal[i][j+1] = add(this.normal[i][j+1], normal);
                this.normal[i+1][j+1] = add(this.normal[i+1][j+1], normal);

                // //bottom right
                a = subtract(two, three);
                b = subtract(four, three);

                normal = normalize(cross(a,b));
                this.normal[i][j+1] = add(this.normal[i][j+1], normal);
                this.normal[i+1][j+1] = add(this.normal[i+1][j+1], normal);
                this.normal[i+1][j] = add(this.normal[i+1][j], normal);

                // //bottom left
                a = subtract(three, four);
                b = subtract(one, four);
                normal = normalize(cross(a,b));
                this.normal[i][j] = add(this.normal[i][j], normal);
                this.normal[i+1][j] = add(this.normal[i+1][j], normal);
                this.normal[i+1][j+1] = add(this.normal[i+1][j+1], normal);
            }
        }
       
        //divide and normalise the normals
        for (var i = 0; i <= this.lengthDiamond; i++) {
            for (var j = 0; j <= this.lengthDiamond;  j++) {
                //only divide by 3 for the corner points
                if ((i==0 && j==0) || (i==0 && j==this.lengthDiamond) || (i==this.lengthDiamond && j==0) || 
                    (i==this.lengthDiamond && j==this.lengthDiamond)) {
                     this.normal[i][j][0] /= 3;
                    this.normal[i][j][1] /= 3;
                    this.normal[i][j][2] /= 3;
                    this.normal[i][j] = normalize(this.normal[i][j]);
                }
                //edge rows get divided by 6
                else if (i==0 || i==this.lengthDiamond || j==0 || j==this.lengthDiamond) {
                    this.normal[i][j][0] /= 6;
                    this.normal[i][j][1] /= 6;
                    this.normal[i][j][2] /= 6;
                    this.normal[i][j] = normalize(this.normal[i][j]);
                }
                //all other vertexes get divided by 12
                else {
                    this.normal[i][j][0] /= 12;
                    this.normal[i][j][1] /= 12;
                    this.normal[i][j][2] /= 12;
                    this.normal[i][j] = normalize(this.normal[i][j]);
                }
            }
        }
    }

    this.updateVertices = function() {
        this.vertices = [];
        var stepX = (this.xMax - this.xMin)/this.col;
        var stepZ = (this.zMax - this.zMin)/this.row;
        var y = 0; var x; var z;    //variable for various coordinates
        var row = 0; var col = 0;
        var max = Number.MIN_VALUE;
        //Generate the points
        //row
        for (x = this.xMin; x <= this.xMax+0.01; x+=stepX) {
            //col
            for (z = this.zMin; z <= this.zMax+0.01; z+=stepZ) {    
                y = this.diamondSquare[row][col];
                this.vertices.push(x,y,z);  //points
                this.vertices.push(0.4, 0.4, 0.4);  //color
                this.vertices.push(this.normal[row][col][0],this.normal[row][col][1],this.normal[row][col][2]);   //normals associated with that point
                col++;  

                if (y > max) {
                    max = y;
                }
            }
            //we go by row then col
            col=0; row++;
        }
        //make sure correct buffer is updated
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW);
        //send max height to render water
        this.maxHeight;
    }

    //actually calculates values in the diamond square array 
    this.calculateDS = function() {
        //set the initial 4 points needed
        this.diamondSquare[0][0] = 1;
        this.diamondSquare[0][this.lengthDiamond] = 1;
        this.diamondSquare[this.lengthDiamond][0] = 1;
        this.diamondSquare[this.lengthDiamond][this.lengthDiamond] = 1;

        var counter = 0;
        var roughness = 0.75; var r; var average;
        for (var length = this.lengthDiamond; length >= 2; length/=2) {
            //calculate the square side
           r = roughness * length;
            for (var x = 0; x < this.lengthDiamond; x+=length) {
                for (var z = 0; z < this.lengthDiamond; z+=length) {
                    //top left + top right + bottom left + bottom right
                    if (this.diamondSquare[x+(length/2)][z+(length/2)] == 0) {
                        average = 
                            this.diamondSquare[x][z] + 
                            this.diamondSquare[x][z+length] + 
                            this.diamondSquare[x+length][z] + 
                            this.diamondSquare[x+length][z+length];
                        average/=4.0;
                        average += (Math.random()*2*r-r);
                        this.diamondSquare[x+(length/2)][z+(length/2)] = average;
                    }
                }
            }
       
            for (var x = 0; x < this.lengthDiamond; x+=length/2) {
                for (var z = (x+(length/2))%length; z < this.lengthDiamond; z+=length) {
                    if (this.diamondSquare[x][z] == 0) {
                        average =
                        (this.diamondSquare[(x-length/2+this.lengthDiamond)%this.lengthDiamond][z] + 
                        this.diamondSquare[x][(z-length/2+this.lengthDiamond)%this.lengthDiamond] +
                        this.diamondSquare[x][(z+length/2)%this.lengthDiamond] + 
                        this.diamondSquare[(x+length/2)%this.lengthDiamond][z])/4.0 + (Math.random()*2*r-r);
                        this.diamondSquare[x][z] = average;
                        //here we copy it onto the other side of the array; 
                        //I figured that doing so smoothens the sides and also saves some computing
                        if (x == 0) {
                            this.diamondSquare[this.lengthDiamond][z] = average;
                        }
                        if (z == 0) {
                            this.diamondSquare[x][this.lengthDiamond] = average;
                        }
                    }
                }
            }
    
            // I initially did this by calculating the center of each diamond, I later managed to optimise it 
            // into the loop you see above
        //     for (var x = length/2; x < this.lengthDiamond; x+=length) {
        //         for (var z = length/2; z < this.lengthDiamond; z+=length) {
        //             //center  
        //             var row; var col;
        //             row = x - length/2;
        //             col = z;
        //             //top
        //             if (this.diamondSquare[row][col] == 0) {
        //                 //console.log(++counter);
        //                 console.log(row + " " + col);
        //                 average = (this.diamondSquare[(row-length/2+this.lengthDiamond)%this.lengthDiamond][col] + 
        //                 this.diamondSquare[row][(col-length/2+this.lengthDiamond)%this.lengthDiamond] +
        //                 this.diamondSquare[row][(col+length/2)%this.lengthDiamond] + 
        //                 this.diamondSquare[(row+length/2)%this.lengthDiamond][col])/4.0;
        //                 average += (Math.random()*2*r- r);
        //                 this.diamondSquare[row][col] = average;
        //                 if (row == 0) {
        //                     this.diamondSquare[this.lengthDiamond][z] = average;
        //                 }
        //                 if (col == 0) {
        //                     this.diamondSquare[x][this.lengthDiamond] = average;
        //                 }
        //             }
        //             //left
        //             row = x;
        //             col = z - length/2;
        //             if (this.diamondSquare[row][col] == 0) {
        //                 //console.log(++counter);
        //                 average = (this.diamondSquare[(row-length/2+this.lengthDiamond)%this.lengthDiamond][col] + 
        //                 this.diamondSquare[row][(col-length/2+this.lengthDiamond)%this.lengthDiamond] +
        //                 this.diamondSquare[row][(col+length/2)%this.lengthDiamond] + 
        //                 this.diamondSquare[(row+length/2)%this.lengthDiamond][col])/4.0;
        //                 average += (Math.random()*2*r- r);
        //                 this.diamondSquare[row][col] = average;
        //                 if (row == 0) {
        //                     this.diamondSquare[this.lengthDiamond][z] = average;
        //                 }
        //                 if (col == 0) {
        //                     this.diamondSquare[x][this.lengthDiamond] = average;
        //                 }
        //             }
        //             //right
        //             row = x;
        //             col = z + length/2;
        //             if (this.diamondSquare[row][col] == 0) {
        //                 //console.log(++counter);
        //                 average = (this.diamondSquare[(row-length/2+this.lengthDiamond)%this.lengthDiamond][col] + 
        //                 this.diamondSquare[row][(col-length/2+this.lengthDiamond)%this.lengthDiamond] +
        //                 this.diamondSquare[row][(col+length/2)%this.lengthDiamond] + 
        //                 this.diamondSquare[(row+length/2)%this.lengthDiamond][col])/4.0;
        //                 average += (Math.random()*2*r- r);
        //                 this.diamondSquare[row][col] = average;
        //                 if (row == 0) {
        //                     this.diamondSquare[this.lengthDiamond][z] = average;
        //                 }
        //                 if (col == 0) {
        //                     this.diamondSquare[x][this.lengthDiamond] = average;
        //                 }
        //             }
        //             //bottom
        //             row = x + length/2;
        //             col = z;
        //             if (this.diamondSquare[row][col] == 0) {
        //                 //console.log(++counter);
        //                 average = (this.diamondSquare[(row-length/2+this.lengthDiamond)%this.lengthDiamond][col] + 
        //                 this.diamondSquare[row][(col-length/2+this.lengthDiamond)%this.lengthDiamond] +
        //                 this.diamondSquare[row][(col+length/2)%this.lengthDiamond] + 
        //                 this.diamondSquare[(row+length/2)%this.lengthDiamond][col])/4.0;
        //                 average += (Math.random()*2*r-r);
        //                 this.diamondSquare[row][col] = average;
        //                 if (row == 0) {
        //                     this.diamondSquare[this.lengthDiamond][z] = average;
        //                 }
        //                 if (col == 0) {
        //                     this.diamondSquare[x][this.lengthDiamond] = average;
        //                 }
        //             }
        //         }
        //     }
        } 
        //following are used to add adjacent tiles
        //keep track of the top left point
       
        for (var i = 0; i < this.diamondSquare[0].length; i++) {
            this.leftRight.push(this.diamondSquare[0][i]);
        }

        for (var i = 0; i < this.diamondSquare[0].length; i++) {
            this.topBottom.push(this.diamondSquare[i][0]);
        }
    }

    //updateBuffer is a separate function as all three drawing functions use it to make sure the right vertices are loaded
    //else Webgl might confuse this with the axes
    this.updateBuffer = function() {
        //rebind in case some other buffer has be binded
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        
        // Set the association for the position attribute
        var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get storage location');
            return -1;
        }
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*9,0);
        gl.enableVertexAttribArray(a_Position);

        // Set the association for the color attribute
        var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
        if (a_Color < 0) {
            console.log('Failed to get storage location');
            return -1;
        }
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*9,FSIZE*3);
        gl.enableVertexAttribArray(a_Color);

        // Set the association for the normal attribute
        var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
        if (a_Normal < 0) {
            console.log('Failed to get storage location');
            return -1;
        }
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false,  FSIZE*9, FSIZE*6);
        gl.enableVertexAttribArray(a_Normal);
    }

    //Skin
    this.drawSkin = function() {
        this.updateBuffer();

        //change these if we are drawing a skin
        var rows = this.row; var cols = this.col;

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
        indices = new Uint16Array(indices);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);  

        //polygon offset is used so that lines can be seen
        gl.polygonOffset(1.0, 1.0)
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.drawElements(gl.TRIANGLE_STRIP, (rows*2)*(cols+1)+degenerateT, gl.UNSIGNED_SHORT, 0); //
        gl.disable(gl.POLYGON_OFFSET_FILL);
    }

}

//function to update camera; this helps 'move' around; takes in Mat4();
function updateCamera(gl, movementMat) {
    gl.uniformMatrix4fv(gl.u_ViewMatrix, false, flatten(movementMat));
}

// //function to update the rotations and zooms
function updateMovement(gl, yaw, pitch, xShift, yShift, zShift, change) {
    var movementMat = mat4();
    //first we reverse the rotations thus far
    movementMat = mult(movementMat, rotate(-pitch, 1,0,0));
    movementMat = mult(movementMat, rotate(-yaw, 0,1,0));
    //then we reverse the translates thus far
    movementMat = mult(movementMat, translate(-xShift, -yShift, -zShift));
    updateCamera(gl, movementMat);
}

//calculate the hash of the given position of the camera
function getHash(xShift, zShift) {
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
    if (xShift%WIDTH >= WIDTH/2) {
        xOrigin = Math.ceil(xShift/WIDTH);
    }
    else {
        xOrigin = Math.floor(xShift/WIDTH);
    }
    if (zShift%WIDTH >= WIDTH/2) {
        zOrigin = Math.ceil(zShift/WIDTH);
    }
    else {
        zOrigin = Math.floor(zShift/WIDTH);
    }
    xOrigin *= WIDTH; zOrigin *= WIDTH;
    if (xNeg) {
        xOrigin *= -1;
    }
    if (zNeg) {
        zOrigin *= -1;
    }
    return (xOrigin + "," + zOrigin);
}

//creates a new terrain and adds it to tile array
function createNewTile(gl, origin, tiles, length) {
    var data = origin.split(",");
    var x = parseInt(data[0]);
    var z = parseInt(data[1]);
    var newTile = new HeightField(gl, x-WIDTH/2, x+WIDTH/2, z-WIDTH/2, z+WIDTH/2, length);  //create the new tile
    //these are the hash key for tiles surrounding the new tile
    var left = (x-WIDTH)+","+z; var right = (x+WIDTH)+","+z; var top = x+","+(z-WIDTH); var bottom = x+","+(z+WIDTH);

    var LR = false; var UD = false;
    for (var key in tiles) {
        //copy any adjacent tiles
        if (key == left || key == right) {
            newTile.setHeightLR(tiles[key].leftRight);
            LR = true;
        }
        if (key == top || key == bottom) {
            newTile.setHeightTB(tiles[key].topBottom);
            UD = true;
        }
        //slight optimisation to reduce work
        if (LR && UD) {
            break;
        }
    }
    newTile.calculateDS();
    newTile.calculateNormal();
    
    //make sure the normals are correct
    var times = 0;
    for (var key in tiles) {
        if (key == left) {
            newTile.setNormalsL(tiles[key].normal);
            times++;
        }
        if (key == right) {
            newTile.setNormalsR(tiles[key].normal);
            times++;
        }
        if (key == top) {
            newTile.setNormalsT(tiles[key].normal);
            times++;
        }
        if (key == bottom) {
            newTile.setNormalsB(tiles[key].normal);
            times++;
        }
        //slight optimisation to reduce work
        if (times == 2) {
            break;
        }
    }
    newTile.updateVertices();
    tiles[origin] = newTile;

}

//removes excessive tiles by checking if there are within a certain radius of the current cmaera position
function checkTilesWithin(origin, key, tiles) {
    var camData = origin.split(",");
    //camera position
    var camX = parseInt(camData[0]);
    var camZ = parseInt(camData[1]);
    //position of tile
    var tileData = key.split(",");
    //tile position
    var tileX = parseInt(tileData[0]);
    var tileZ = parseInt(tileData[1]);
    var xWithin = true; var zWithin = true;
    if (tileX <(camX-(WIDTH*2+50)) || tileX > (camX+(WIDTH*2+50))) {
        xWithin = false;
    }
    if (tileZ < (camZ-(WIDTH*2+50)) || tileZ > (camZ+(WIDTH*2+50))) {
        zWithin = false;
    }
    return xWithin && zWithin;
}

window.onload = function() {
    var gl = initialize(0,40,10);    //takes in light direction

    //the following are related to the camera
    //initial properties for moving around the system
    var lrRate = 0; var udRate = 0;
    var xShift = 0; var yShift = 90; var zShift = 0; var asceDescend = 0; var sideMove = 0;
    var speed = 0; var yaw = 0; var pitch = 0;
    document.addEventListener('keydown', function(event) {
        //moves camera forward: up arrow
        if (event.keyCode == 38) {
            event.preventDefault();
            speed = 0.2;
        }
        //moves camera back: down arrow
        else if (event.keyCode == 40) {
            event.preventDefault();
            speed = -0.2;  
        }
        //moves camera left: left arrow
        else if (event.keyCode == 37) {
            event.preventDefault();
            sideMove = -0.03;  
        }
        //moves camera right: right arrow
        else if (event.keyCode == 39) {
            event.preventDefault();
            sideMove = 0.03;  
        }
        //ascend: q key
        else if (event.keyCode == 81) {
            asceDescend = 1;
        }
        //descend: e key
        else if (event.keyCode == 69) {
            asceDescend = -1;
        }
        //pitches up: w key
        else if (event.keyCode == 87) {
            udRate = 0.05;
        }
        //pitches down: s key
        else if (event.keyCode == 83) {
             udRate = -0.05;
        }
        //yaw left: a key
        else if (event.keyCode == 65) {
            lrRate = 0.1;
        }
        //yaw right: d key
        else if (event.keyCode == 68) {
            lrRate = -0.1;
        }
    })
    
    document.addEventListener('keyup', function(event) {
        if (event.keyCode == 38 || event.keyCode == 40) {
            event.preventDefault();
            speed = 0
        }
        else if (event.keyCode == 87 || event.keyCode == 83) {
            udRate = 0;
        }
        else if (event.keyCode == 65 || event.keyCode == 68) {
            lrRate = 0;
        }
        else if (event.keyCode == 81 || event.keyCode == 69) {
            asceDescend = 0;
        } 
        else if (event.keyCode == 37 || event.keyCode == 39) {
            sideMove = 0;
        }
    });

    //property for the origin tile
    var n = 7;
    var xMin = -WIDTH/2; var xMax = WIDTH/2; var zMin = -WIDTH/2; var zMax = WIDTH/2; var length = Math.pow(2,n);
    
    //hash map containing all the current tiles
    var tiles = {};

    //original tile
    var height1 = new HeightField(gl, xMin, xMax, zMin, zMax, length);
    height1.calculateDS();
    height1.calculateNormal();
    height1.updateVertices();
    tiles[height1.origin] = height1;
   
    //right tile
    var height2 = new HeightField(gl, xMax, xMax+WIDTH, zMin, zMax, length);
    height2.setHeightLR(height1.leftRight);
    height2.calculateDS();
    height2.calculateNormal();
    height2.setNormalsL(height1.normal);
    height2.updateVertices();
    tiles[height2.origin] = height2;

    //left tile 
    var height3 = new HeightField(gl, xMin-WIDTH, xMin, zMin, zMax, length);
    height3.setHeightLR(height1.leftRight);
    height3.calculateDS();
    height3.calculateNormal();
    height3.setNormalsR(height1.normal);
    height3.updateVertices();
    tiles[height3.origin] = height3;

    //top tile
    var height4 = new HeightField(gl, xMin, xMax, zMin-WIDTH, zMin, length);
    height4.setHeightTB(height1.topBottom);
    height4.calculateDS();
    height4.calculateNormal();
    height4.setNormalsB(height1.normal);
    height4.updateVertices();
    tiles[height4.origin] = height4;

    //bottom tile
    var height5 = new HeightField(gl, xMin, xMax, zMax, zMax+WIDTH, length);
    height5.setHeightTB(height1.topBottom);
    height5.calculateDS();
    height5.calculateNormal();
    height5.setNormalsT(height1.normal);
    height5.updateVertices();
    tiles[height5.origin] = height5;

    //top left tile
    var height6 = new HeightField(gl, xMin-WIDTH, xMin, zMin-WIDTH, zMin, length);
    height6.setHeightTB(height3.topBottom);
    height6.setHeightLR(height4.leftRight);
    height6.calculateDS();
    height6.calculateNormal();
    height6.setNormalsR(height4.normal);
    height6.setNormalsB(height3.normal);
    height6.updateVertices();
    tiles[height6.origin] = height6;

    // //top right tile
    var height7 = new HeightField(gl, xMax, xMax+WIDTH, zMin-WIDTH, zMin, length);
    height7.setHeightTB(height2.topBottom);
    height7.setHeightLR(height4.leftRight);
    height7.calculateDS();
    height7.calculateNormal();
    height7.setNormalsL(height4.normal);
    height7.setNormalsB(height2.normal);
    height7.updateVertices();
    tiles[height7.origin] = height7;

    // //bottom left tile
    var height8 = new HeightField(gl, xMin-WIDTH, xMin, zMax, zMax+WIDTH, length);
    height8.setHeightTB(height3.topBottom);
    height8.setHeightLR(height5.leftRight);
    height8.calculateDS();
    height8.calculateNormal();
    height8.setNormalsR(height5.normal);
    height8.setNormalsT(height3.normal);
    height8.updateVertices();
    tiles[height8.origin] = height8;

    // //bottom right tile
    var height9 = new HeightField(gl, xMax, xMax+WIDTH, zMax, zMax+WIDTH, length);
    height9.setHeightTB(height2.topBottom);
    height9.setHeightLR(height5.leftRight);
    height9.calculateDS();
    height9.calculateNormal();
    height9.setNormalsL(height5.normal);
    height9.setNormalsT(height2.normal);
    height9.updateVertices();
    tiles[height9.origin] = height9;

    //set the waterline by getting the maxHeight from all the terrain
    var waterline = 0;
    for (var key in tiles) {
        if (tiles.hasOwnProperty(key)) {
            if (tiles[key].maxHeight > waterline) {
                waterline = tiles[key].maxHeight;
            }
        }  
    }
    waterline *= 0.3; //set the threshoold
    //update the uniform
    u_waterLine = gl.getUniformLocation(gl.program, 'u_waterLine');
    gl.uniform1f(u_waterLine, waterline);
    var numTiles = 9;
    var lastT = 0; var nowT; var elapsed; var change = 0; var newSideA; 
    var elapsedTime = 0;
    var frameCount = 0;
    var lastTime = 0; var fps;
    //this helps updates the drawing of the heightField
    function update() {
        gl.clear(gl.COLOR_BUFFER_BIT);  //clear everything to prepare for redraw

        nowT = Date.now();
        frameCount++;
        elapsedTime += (nowT - lastT);
        if(elapsedTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            elapsedTime = 0;
            console.log(fps); console.log("numTiles: " + numTiles);
        }

        if (lastT != 0) {
            elapsed = nowT-lastT;

            //move forwards/backwards
            if (speed != 0) {
                xShift -= Math.sin(radians(yaw)) * speed * elapsed;
                zShift -= Math.cos(radians(yaw)) * speed * elapsed;
            }
            
            //ascend or descend
            yShift -= (asceDescend * elapsed) * 0.03;
            
            //these calculate the actual angles
            yaw += lrRate * elapsed;
            change = udRate * elapsed
            if ((pitch+change) >= -90 && (pitch+change) <= 90) {
                pitch += change;
            }

            //move sideways
            newSideA = cross(vec3(Math.sin(radians(yaw)),0,Math.cos(radians(yaw))), vec3(0,1,0));
            xShift -= newSideA[0]*sideMove * elapsed;
            yShift -= newSideA[1]*sideMove* elapsed;
            zShift -= newSideA[2]*sideMove* elapsed;

            //we extend the movement vector to predict where the camera will be in the future
            var predictPosKey = getHash(xShift - Math.sin(radians(yaw))*100, zShift - Math.cos(radians(yaw))*100);
        
            //adds an additional tile if we are roaming around;
            if (!(predictPosKey in tiles)) {
                createNewTile(gl, predictPosKey, tiles, length);
                numTiles++;
            }
            //delete all the terrain that we do not need; we always maintain at least 3 by 3 grid around the camera
            var currPosKey = getHash(xShift-5, zShift-5);
            for (var key in tiles) {
                if (tiles.hasOwnProperty(key)) {
                   if (!(checkTilesWithin(currPosKey, key, tiles))) {
                        delete tiles[key];
                        numTiles--;
                   }
               }
            }
        }

        lastT = nowT;
        updateMovement(gl, yaw, pitch, xShift, yShift, zShift, change);
        //iterate through the terrain objects and draw them
        for (var key in tiles) {
            if (tiles.hasOwnProperty(key)) {
                tiles[key].drawSkin();
            }
        }

        //creates a loop
        requestAnimationFrame(update);
    }
    //kickstarts the entire rendering
    requestAnimationFrame(update);
}

