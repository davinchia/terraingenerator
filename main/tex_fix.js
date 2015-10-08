/*
DAVIN CHIA AND JOSEPH BUTTON


A HIGHLY REALISTIC WORLD IN THE BROWSER

- INFINITE TILLING
- FRACTAL CLOUDS
- RAIN PARTICLE SYSTEM, GPU CALCULATED
- CAMERA DEPENDENT LEVEL OF DETAIL
- PARTIAL ENVIRONMENT MAPPING
- TEXTURED TERRAIN
- SKYBOX

THIS IS THE MAIN JS FILE THAT EXECUTES THE PROGRAM

*/

//various constants throughout the program
const SCALE = 40;   //used as a scale for the view; this is so that we do not need to generate too many vertices for the view
const FSIZE = 4;    //used for buffers
const N = 4;    //the size of our array; partially due to the diamond square algorithm
const SMALLEST = 1;
const LENGTH = Math.pow(2,N);   //length 
const WIDTH = LENGTH*SMALLEST;  //length of the smallest square that we are generate; the 'highest' resolution
var roughness = 0.3; var count = 1;

//PerlinNoise function; this is from an online library, we are using it to make
//our Diamond-square more organic looking
PerlinNoise = new function() {

this.noise = function(x, y, z) {

   var p = new Array(512)
   var permutation = [ 151,160,137,91,90,15,
   131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
   190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
   88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
   77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
   102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
   135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
   5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
   223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
   129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
   251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
   49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
   138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
   ];
   for (var i=0; i < 256 ; i++) 
 p[256+i] = p[i] = permutation[i]; 

      var X = Math.floor(x) & 255,                  // FIND UNIT CUBE THAT
          Y = Math.floor(y) & 255,                  // CONTAINS POINT.
          Z = Math.floor(z) & 255;
      x -= Math.floor(x);                                // FIND RELATIVE X,Y,Z
      y -= Math.floor(y);                                // OF POINT IN CUBE.
      z -= Math.floor(z);
      var    u = fade(x),                                // COMPUTE FADE CURVES
             v = fade(y),                                // FOR EACH OF X,Y,Z.
             w = fade(z);
      var A = p[X  ]+Y, AA = p[A]+Z, AB = p[A+1]+Z,      // HASH COORDINATES OF
          B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;      // THE 8 CUBE CORNERS,

      return scale(lerp(w, lerp(v, lerp(u, grad(p[AA  ], x  , y  , z   ),  // AND ADD
                                     grad(p[BA  ], x-1, y  , z   )), // BLENDED
                             lerp(u, grad(p[AB  ], x  , y-1, z   ),  // RESULTS
                                     grad(p[BB  ], x-1, y-1, z   ))),// FROM  8
                     lerp(v, lerp(u, grad(p[AA+1], x  , y  , z-1 ),  // CORNERS
                                     grad(p[BA+1], x-1, y  , z-1 )), // OF CUBE
                             lerp(u, grad(p[AB+1], x  , y-1, z-1 ),
                                     grad(p[BB+1], x-1, y-1, z-1 )))));
   }
   function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
   function lerp( t, a, b) { return a + t * (b - a); }
   function grad(hash, x, y, z) {
      var h = hash & 15;                      // CONVERT LO 4 BITS OF HASH CODE
      var u = h<8 ? x : y,                 // INTO 12 GRADIENT DIRECTIONS.
             v = h<4 ? y : h==12||h==14 ? x : z;
      return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
   } 
   function scale(n) { return (1 + n)/2; }
}

//changes the perlin noise's range, original 0 to 1, to a user specified range
function scaleToRange(perlin, range) {
    return perlin * range;
}


function initialize() {
	
    var canvas = document.getElementById('gl-canvas');
   
    var gl = WebGLUtils.setupWebGL(canvas);
    
    if (!gl) {
        alert("Could not create WebGL context");
        return;
    }
	
    // set the viewport to be sized correctly
    gl.viewport(0,0, canvas.width, canvas.height);
    
    // set the background or clear color
    gl.clearColor(0.1, 0.1, 0.1, 0.9);
    //allow 3d rendering
    gl.enable(gl.DEPTH_TEST);
	
	
    // create program with our shaders and enable it
    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);
   
	//initialize the uniforms/attributes into objects of the gl context
	gl.u_ViewMatrix =  gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    
	gl.u_ModelMatrix =  gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(scale(SCALE, SCALE/2, SCALE)));
	
	
	gl.u_Projection =  gl.getUniformLocation(gl.program, 'u_Projection');
		gl.projection = perspective(60, 1, 1, 1000*SCALE);
		gl.uniformMatrix4fv(gl.u_Projection, false, flatten(gl.projection));
	
	
	//Allow Draw type 0,1,2
			//positon, white, set
	gl.u_drawType =  gl.getUniformLocation(gl.program, 'u_drawType');
	
	gl.u_light_ambient = gl.getUniformLocation(gl.program, 'light_ambient');
		 gl.uniform3f(gl.u_light_ambient, 0.3, 0.3, 0.3);
	gl.u_light_diffuse = gl.getUniformLocation(gl.program, 'light_diffuse');
		gl.uniform3f(gl.u_light_diffuse, 0.6, 0.6, 0.6);
	gl.u_light_specular = gl.getUniformLocation(gl.program, 'light_specular');
		gl.uniform3f(gl.u_light_specular, 0.6, 0.6, 0.6);
	
	gl.u_shininess = gl.getUniformLocation(gl.program, 'shininess');
		gl.uniform1f(gl.u_shininess, 2.0);
	
	
	gl.a_Color = gl.getAttribLocation(gl.program, "a_Color");
	gl.a_LightPosition = gl.getAttribLocation(gl.program, "a_LightPosition");	
	gl.vertexAttrib4fv(gl.a_LightPosition, flatten(vec4(0.0,10000,0,0)));

		
	
	//get location of attribute text_coord
	gl.a_TextCoord = gl.getAttribLocation(gl.program, "a_TextCoord");
	gl.enableVertexAttribArray(gl.a_TextCoord);
	
    gl.u_time = gl.getUniformLocation(gl.program, 'u_time');
    gl.u_camPos = gl.getUniformLocation(gl.program, 'u_camPos');

	gl.u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
	gl.u_BumpSampler = gl.getUniformLocation(gl.program, 'u_BumpSampler');

	gl.u_SandSampler = gl.getUniformLocation(gl.program, 'u_SandSampler');
    gl.uniform1i(gl.u_SandSampler,12);

	gl.u_SnowSampler = gl.getUniformLocation(gl.program, 'u_SnowSampler');
		
	gl.u_bGrassSampler = gl.getUniformLocation(gl.program, 'u_bGrassSampler');
	gl.uniform1i(gl.u_bGrassSampler,14);
	
    gl.u_cubeSampler=gl.getUniformLocation(gl.program, 'u_CubeSampler');
	gl.uniform1i(gl.u_CubeSampler,10);

    gl.drawType = gl.getUniformLocation(gl.program, 'drawType');

	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);
	
		
		
    return gl;
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
    movementMat = mult(movementMat, translate(-xShift*SCALE, -yShift, -zShift*SCALE)); //allows the camera to keep up with the terrain
    updateCamera(gl, movementMat);
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

//object used to model the terrain; only contains the height and the normals of each tile;
function HeightField(gl, xMin, xMax, zMin, zMax, lengthS) {
    //basic properties required to draw the heightField
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

    //actually calculates values in the diamond square array 
    this.calculateDS = function() {
        //set the initial 4 points needed
        this.diamondSquare[0][0] = 1;
        this.diamondSquare[0][this.lengthDiamond] = 1;
        this.diamondSquare[this.lengthDiamond][0] = 1;
        this.diamondSquare[this.lengthDiamond][this.lengthDiamond] = 1;

        var counter = 0;
        var r; var average;
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
        } 

        //following are used to add adjacent tiles
        //keep track of the top left point
        for (var i = 0; i < this.diamondSquare[0].length; i++) {
            this.leftRight.push(this.diamondSquare[0][i]);
        }

        for (var i = 0; i < this.diamondSquare[0].length; i++) {
            this.topBottom.push(this.diamondSquare[i][0]);
        }
        
        if (count <= 6) {
            roughness += (PerlinNoise.noise(x, z, 0.3)/1000);
            
        }
        else if (count == 12) {
            roughness*= 0.5;
            count = 1;

        }
        else {
            roughness -= (PerlinNoise.noise(x, z, 0.3)/1000);   //pseudo-random variations
        }
    }
}

//calculate the hash of the given position of the camera; note that shared borders hash to the same square; this is why the divisor is WIDTH+0.1
//note that 0,0 hashes to the other tile; this hash is for little tiles within the largeTile wrapper object
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
    xOrigin = Math.floor(xShift/(WIDTH+0.0001)) * WIDTH + WIDTH/2;
    zOrigin = Math.floor(zShift/(WIDTH+0.0001)) * WIDTH + WIDTH/2;
    if (xNeg) {
        xOrigin *= -1;
    }
    if (zNeg) {
        zOrigin *= -1;
    };
    return (xOrigin + "," + zOrigin);
}

//creates a new terrain and adds it to tile array: origin is middle point
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
    tiles[newTile.origin] = newTile;
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

//helper function
function createNewLargeTileHelper(gl, origin, TilesL, length) {
    var originData = origin.split(",");

    var xMin = parseInt(originData[0]) - 8*WIDTH;
    var xMax = parseInt(originData[0]) + 8*WIDTH;

    var zMin = parseInt(originData[1]) - 8*WIDTH;
    var zMax = parseInt(originData[1]) + 8*WIDTH;
    console.log("x: " + xMin + " " + xMax);
    console.log("z: " + zMin + " " + zMax);
    createNewLargeTile(gl, xMin, xMax, zMin, zMax, TilesL, length);
}

//creates large tile and hashes it to vTilesLarge; each tile should be 256 * 256 wide
function createNewLargeTile(gl, xMin, xMax, zMin, zMax, TilesLarge, length) {
    var tiles = {}; 
    for (var i = zMin; i < zMax; i+=WIDTH) { 
        for (var j = xMin; j < xMax; j+=WIDTH) {
            createNewTile(gl, (j+WIDTH/2) + "," + (i+WIDTH/2), tiles, length);
        }
    }
    var tile = new LargeTile((xMin+(WIDTH*8)) + "," + (zMin+(WIDTH*8)), tiles, xMin, zMin);
    console.log(tile.origin);
    TilesLarge[tile.origin] = tile;
}

window.onload = function main(){
	
    //create the gl context
	gl = initialize();
	
    //camera controls
	var lrRate = 0; var udRate = 0;
    var xShift = 0; var yShift = 40; var zShift = 0; var asceDescend = 0; var sideMove = 0;
    var speed = 0; var yaw = 0; var pitch = 0;
	var nowT; var lastT = 0; var change = 0;
    document.addEventListener('keydown', function(event) {
        //moves camera forward: up arrow
        if (event.keyCode == 38) {
            event.preventDefault();
            speed = 0.02;
        }
        //moves camera back: down arrow
        else if (event.keyCode == 40) {
            event.preventDefault();
            speed = -0.02;  
        }
        //moves camera left: left arrow
        else if (event.keyCode == 37) {
            event.preventDefault();
            sideMove = -0.02;  
        }
        //moves camera right: right arrow
        else if (event.keyCode == 39) {
            event.preventDefault();
            sideMove = 0.02;  
        }
        //ascend: q key
        else if (event.keyCode == 81) {
            asceDescend = 3;
        }
        //descend: e key
        else if (event.keyCode == 69) {
            asceDescend = -3;
        }
        //pitches up: w key
        else if (event.keyCode == 87) {
            udRate = 0.02;
        }
        //pitches down: s key
        else if (event.keyCode == 83) {
             udRate = -0.02;
        }
        //yaw left: a key
        else if (event.keyCode == 65) {
            lrRate = 0.02;
			
        }
        //yaw right: d key
        else if (event.keyCode == 68) {
            lrRate = -0.05;
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
	
	var xyzLocation = document.getElementById("location");
	var heading = document.getElementById("angle");
	
	var xMin = -16*WIDTH; var xMax = 16*WIDTH; var zMin = -16*WIDTH; var zMax = 16*WIDTH; var length = LENGTH;
	
    //hash map containing all the current tiles
    var tiles = {};

    //contains all the large objects; largeTiles are terrains that is generated but not yet rendered to the screen; each large tile contains 16 * 16
    //small tiles; this is because we are using a camera that has increased resolution closer to the viewer, and less resolution away
    //this allows us to push roughly 3 millions polygons, 40 virtual tiles that form the screen terrain, each containing 17 * 17 *  to the screen at one time, and run it at an acceptable rate 
    var TilesL = {};

    //start tiles so that user can roam around without having to wait for the system to generate new tiles
	createNewLargeTile(gl, -WIDTH*8, WIDTH*8, -WIDTH*8, WIDTH*8, TilesL, length);   //origin
    createNewLargeTile(gl, -WIDTH*8, WIDTH*8, -WIDTH*24, -WIDTH*8, TilesL, length); //top   
	createNewLargeTile(gl, -WIDTH*8, WIDTH*8, WIDTH*8, WIDTH*24, TilesL, length);   //bottom
    createNewLargeTile(gl, -WIDTH*24, -WIDTH*8, -WIDTH*8, WIDTH*8, TilesL, length); //left
    createNewLargeTile(gl, WIDTH*8, WIDTH*24, -WIDTH*8, WIDTH*8, TilesL, length);   //right
    createNewLargeTile(gl, -WIDTH*24, -WIDTH*8, -WIDTH*24, -WIDTH*8, TilesL, length); //top left
    createNewLargeTile(gl, WIDTH*8, WIDTH*24, -WIDTH*24, -WIDTH*8, TilesL, length);   //top right
    createNewLargeTile(gl, -WIDTH*24, -WIDTH*8, WIDTH*8, WIDTH*24, TilesL, length); //bot left
    createNewLargeTile(gl, WIDTH*8, WIDTH*24, WIDTH*8, WIDTH*24, TilesL, length);   //bot right
    
    roughness = 0;

	var vTiles = []; var origin = [0, 0]; var testCam = [0,0]; var clouds = [];

    //inner smallest tiles
    var test = new virtualT(gl, "01", WIDTH, [-WIDTH, -WIDTH], length);
    test.updateVertices(testCam, TilesL, clouds);
    vTiles[test.num] = test;
    var test1 = new virtualT(gl, "02", WIDTH, [0, -WIDTH], length);
    test1.updateVertices(testCam, TilesL, clouds);
    vTiles[test1.num] = test1;
    var test2 = new virtualT(gl, "03", WIDTH, [-WIDTH, 0], length);
    test2.updateVertices(testCam, TilesL, clouds);
    vTiles[test2.num] = test2;
    var test3 = new virtualT(gl, "04", WIDTH, [0, 0], length);
    vTiles[test3.num] = test3;
    test3.updateVertices(testCam, TilesL, clouds);

    //second layer of smallest tiles
    var test4 = new virtualT(gl, "05", WIDTH, [-WIDTH*2, -WIDTH*2], length);
    test4.updateVertices(testCam, TilesL, clouds);
    vTiles[test4.num] = test4;
    var test5 = new virtualT(gl, "06", WIDTH, [-WIDTH, -WIDTH*2], length);
    test5.updateVertices(testCam, TilesL, clouds);
    vTiles[test5.num] = test5;
    var test6 = new virtualT(gl, "07", WIDTH, [0, -WIDTH*2], length);
    vTiles[test6.num] = test6;
    test6.updateVertices(testCam, TilesL, clouds);
    var test7 = new virtualT(gl, "08", WIDTH, [WIDTH, -WIDTH*2], length);
    test7.updateVertices(testCam, TilesL, clouds);
    vTiles[test7.num] = test7;

    var test8 = new virtualT(gl, "09", WIDTH, [-WIDTH*2, -WIDTH], length);
    test8.updateVertices(testCam, TilesL, clouds);
    vTiles[test8.num] = test8;
    var test9 = new virtualT(gl, "10", WIDTH, [WIDTH, -WIDTH], length);
    test9.updateVertices(testCam, TilesL, clouds);
    vTiles[test9.num] = test9;
    var test10 = new virtualT(gl, "11", WIDTH, [-WIDTH*2, 0], length);
    test10.updateVertices(testCam, TilesL, clouds);
    vTiles[test10.num] = test10;
    var test11 = new virtualT(gl, "12", WIDTH, [WIDTH, 0], length);
    test11.updateVertices(testCam, TilesL, clouds);
    vTiles[test11.num] = test11;
    
    var test12 = new virtualT(gl, "13", WIDTH, [-WIDTH*2, WIDTH], length);
    test12.updateVertices(testCam, TilesL, clouds);
    vTiles[test12.num] = test12;
    var test13 = new virtualT(gl, "14", WIDTH, [-WIDTH, WIDTH], length);
    test13.updateVertices(testCam, TilesL, clouds);
    vTiles[test13.num] = test13;
    var test14 = new virtualT(gl, "15", WIDTH, [0, WIDTH], length);
    test14.updateVertices(testCam, TilesL, clouds);
    vTiles[test14.num] = test14;
    var test15 = new virtualT(gl, "16", WIDTH, [WIDTH, WIDTH], length);
    test15.updateVertices(testCam, TilesL, clouds);
    vTiles[test15.num] = test15;

    //medium
    var test16 = new virtualT(gl, "17", 2*WIDTH, [-WIDTH*4, -WIDTH*4], length);
    test16.updateVertices(testCam, TilesL, clouds);
    vTiles[test16.num] = test16;
    var test17 = new virtualT(gl, "18", 2*WIDTH, [-WIDTH*2, -WIDTH*4], length);
    test17.updateVertices(testCam, TilesL, clouds);
    vTiles[test17.num] = test17;
    var test18 = new virtualT(gl, "19", 2*WIDTH, [0, -WIDTH*4], length);
    test18.updateVertices(testCam, TilesL, clouds);
    vTiles[test18.num] = test18;
    var test19 = new virtualT(gl, "20", 2*WIDTH, [WIDTH*2, -WIDTH*4], length);
    test19.updateVertices(testCam, TilesL, clouds);
    vTiles[test19.num] = test19;

    var test20 = new virtualT(gl, "21", 2*WIDTH, [-WIDTH*4, -WIDTH*2], length);
    test20.updateVertices(testCam, TilesL, clouds);
    vTiles[test20.num] = test20;
    var test21 = new virtualT(gl, "22", 2*WIDTH, [WIDTH*2, -WIDTH*2], length);
    test21.updateVertices(testCam, TilesL, clouds);
    vTiles[test21.num] = test21;
    var test22 = new virtualT(gl, "23", 2*WIDTH, [-WIDTH*4, 0], length);
    test22.updateVertices(testCam, TilesL, clouds);
    vTiles[test22.num] = test22;
    var test23 = new virtualT(gl, "24", 2*WIDTH, [WIDTH*2, 0], length);
    test23.updateVertices(testCam, TilesL, clouds);
    vTiles[test23.num] = test23;

    var test24 = new virtualT(gl, "25", 2*WIDTH, [-WIDTH*4, WIDTH*2], length);
    test24.updateVertices(testCam, TilesL, clouds);
    vTiles[test24.num] = test24;
    var test25 = new virtualT(gl, "26", 2*WIDTH, [-WIDTH*2, WIDTH*2], length);
    test25.updateVertices(testCam, TilesL, clouds);
    vTiles[test25.num] = test25;
    var test26 = new virtualT(gl, "27", 2*WIDTH, [0, WIDTH*2], length);
    test26.updateVertices(testCam, TilesL, clouds);
    vTiles[test26.num] = test26;
    var test27 = new virtualT(gl, "28", 2*WIDTH, [WIDTH*2, WIDTH*2], length);
    test27.updateVertices(testCam, TilesL, clouds);
    vTiles[test27.num] = test27;

    //large
    var test28 = new virtualT(gl, "29", 4*WIDTH, [-WIDTH*8, -WIDTH*8], length);
    test28.updateVertices(testCam, TilesL, clouds);
    vTiles[test28.num] = test28;
    var test29 = new virtualT(gl, "30", 4*WIDTH, [-WIDTH*4, -WIDTH*8], length);
    test29.updateVertices(testCam, TilesL, clouds);
    vTiles[test29.num] = test29;
    var test30 = new virtualT(gl, "31", 4*WIDTH, [0, -WIDTH*8], length);
    test30.updateVertices(testCam, TilesL, clouds);
    vTiles[test30.num] = test30;
    var test31 = new virtualT(gl, "32", 4*WIDTH, [WIDTH*4, -WIDTH*8], length);
    test31.updateVertices(testCam, TilesL, clouds);
    vTiles[test31.num] = test31;

    var test32 = new virtualT(gl, "33", 4*WIDTH, [-WIDTH*8, -WIDTH*4], length);
    test32.updateVertices(testCam, TilesL, clouds);
    vTiles[test32.num] = test32;
    var test33 = new virtualT(gl, "34", 4*WIDTH, [WIDTH*4, -WIDTH*4], length);
    test33.updateVertices(testCam, TilesL, clouds);
    vTiles[test33.num] = test33;
    var test34 = new virtualT(gl, "35", 4*WIDTH, [-WIDTH*8, 0], length);
    test34.updateVertices(testCam, TilesL, clouds);
    vTiles[test34.num] = test34;
    var test35 = new virtualT(gl, "36", 4*WIDTH, [WIDTH*4, 0], length);
    test35.updateVertices(testCam, TilesL, clouds);
    vTiles[test35.num] = test35;

    var test36 = new virtualT(gl, "37", 4*WIDTH, [-WIDTH*8, WIDTH*4], length);
    test36.updateVertices(testCam, TilesL, clouds);
    vTiles[test36.num] = test36;
    var test37 = new virtualT(gl, "38", 4*WIDTH, [-WIDTH*4, WIDTH*4], length);
    test37.updateVertices(testCam, TilesL, clouds);
    vTiles[test37.num] = test37;
    var test38 = new virtualT(gl, "39", 4*WIDTH, [0, WIDTH*4], length);
    test38.updateVertices(testCam, TilesL, clouds);
    vTiles[test38.num] = test38;
    var test39 = new virtualT(gl, "40", 4*WIDTH, [WIDTH*4, WIDTH*4], length);
    test39.updateVertices(testCam, TilesL, clouds);
    vTiles[test39.num] = test39; 

    console.log(clouds);

    var water = new waterLine(gl, WIDTH * 16, -3);
    
    //environment
    var lastT = 0; var nowT; var elapsed; var change = 0; var newSideA; 
    var elapsedTime = 0;
    var lastTime = 0;  var change; var cam;
   
	//because we are using the GPU for all subsequent calculations, we are able to create 50,000 particles,
    //in addition to the numerous terrain features being generated
	//size, avg_velo, location, avg_life, radius, height
    var rain = new particle_cloud2(10000, 40, 80, 2);
    var rain1 = new particle_cloud2(10000, 40, 120, 3);
    var rain2 = new particle_cloud2(15000, 40, 120, 5);
    var rain3 = new particle_cloud2(15000, 40, 140, 6);

    var sky = new skybox(gl, vec3(0,0,0));


	var currentAngle=0;
	var tick = function(){
		currentAngle = update(currentAngle);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		change = false;
        nowT = Date.now();
        
		
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
            yaw = yaw % 360;
            if (!change && yaw > 180) {
                yaw = -(180 - yaw%180);
                change = true;
            }
            else if (!change && yaw < -180) {
                yaw = 180 + yaw%180;
                change = true;
            }
            change = udRate * elapsed
            if ((pitch+change) >= -90 && (pitch+change) <= 90) {
                pitch += change;
            }
			
            //move sideways
            newSideA = cross(vec3(Math.sin(radians(yaw)),0,Math.cos(radians(yaw))), vec3(0,1,0));
            xShift -= newSideA[0]*sideMove * elapsed;
            yShift -= newSideA[1]*sideMove* elapsed;
            zShift -= newSideA[2]*sideMove* elapsed;

            //these are the forward vectors that predict where we will be; tells the system when to create new clouds
            var predictPosKeyF = getHashL2(xShift - Math.sin(radians(yaw)) * WIDTH*16 * 1, zShift - Math.cos(radians(yaw)) * WIDTH*16 * 1);
            var predictPosKeyL; var predictPosKeyR; 
            var data = predictPosKeyF.split(","); var x = parseInt(data[0]); var z = parseInt(data[1]);
            if (yaw > -45 && yaw <= 45) {
                predictPosKeyL = (x-WIDTH*16) + "," + z;
                predictPosKeyR = (x+WIDTH*16) + "," + z;
            } 
            else if (yaw > 45 && yaw <= 135) {
                predictPosKeyL = x + "," + (z + WIDTH*16);
                predictPosKeyR = x + "," + (z - WIDTH*16);
            }
            else if (yaw > 135 || yaw <= -135) {
                predictPosKeyL = (x+WIDTH*16) + "," + z;
                predictPosKeyR = (x-WIDTH*16) + "," + z;  
            }
            else {
                predictPosKeyL = x + "," + (z - WIDTH*16);
                predictPosKeyR = x + "," + (z + WIDTH*16);
            }

            //adds an additional tile if we are roaming around;
            if (!(predictPosKeyF in TilesL)) {
                console.log("top");
                console.log(predictPosKeyF);
                createNewLargeTileHelper(gl, predictPosKeyF, TilesL, length); 
                count++; 
            }
            if (!(predictPosKeyL in TilesL)) {
                console.log("left");
                console.log(predictPosKeyL);
                createNewLargeTileHelper(gl, predictPosKeyL, TilesL, length); 
                count++; 
            }
            if (!(predictPosKeyR in TilesL)) {
                console.log("right");
                console.log(predictPosKeyR);
                createNewLargeTileHelper(gl, predictPosKeyR, TilesL, length); 
                count++; 
            }
		}
		
        updateMovement(gl, yaw, pitch, xShift, yShift, zShift, change);
		    lastT = nowT;

		//Set up the HUD to keep track of location
		xyzLocation.textContent =  "x:" +xShift.toPrecision(2)+" y:"+yShift.toPrecision(2)+" z:"+zShift.toPrecision(2);
		heading.textContent  = "x:" + -1.0 * Math.sin(radians(yaw)).toPrecision(2)+" z:"+ -1.0 * Math.cos(radians(yaw)).toPrecision(2);;
		
        //this is used to keep the terrain up with the camera
		cam = [Math.floor(xShift), Math.floor(zShift)];
        var camU = [Math.floor(cam[0]) - Math.floor(cam[0])%4, Math.floor(cam[1]) - Math.floor(cam[1])%4]
	    
        sky.draw(gl);
        for (var i = clouds.length-1; i >= 0; i--) {
            if (clouds[i].clust.length != 0) {
				clouds[i].draw();
            }
        }

        clouds = new Array();

		for (var key in vTiles) {
           if (vTiles.hasOwnProperty(key)) {
               vTiles[key].updateVertices(camU, TilesL, clouds);
               vTiles[key].drawSkin();
           }
        }

        //rain camera; draws the rain
        var camInfo = vec3(xShift, 0, zShift);
        rain.updateTime(camInfo);
        rain1.updateTime(camInfo);
        rain2.updateTime(camInfo);
        rain3.updateTime(camInfo);

        //draws the water
        water.updateVertices(cam);
        water.draw();


        requestAnimationFrame(tick);
	}
	
	Promise.all([
        initializeTexture(gl, 0,'images/plant.png'),
	   initializeTexture(gl, 14,'images/Grassbrown.jpg'),  //no need
	  initializeSkyTexture(gl, 1, 'images/violentdays_bk.png',"posz"),//posz
	  initializeSkyTexture(gl, 2,'images/violentdays_dn.png',"negy"),//negy; no need
	  initializeSkyTexture(gl, 3,'images/violentdays_lf.png',"negx"),//negx
	  initializeSkyTexture(gl, 4,'images/violentdays_ft.png',"negz"),//negz
	  initializeSkyTexture(gl, 5,'images/violentdays_up.png',"posy"),//posy
	  initializeSkyTexture(gl, 6,'images/violentdays_rt.png',"posx"),//posx
	  initializeTexture(gl, 7,'images/cloud_rgb.jpg'),
	  initializeTexture(gl, 8,'images/cloud_alpha.jpg'),
	  initializeTexture(gl, 9,'images/water_tex.jpg'),
	  initializeTexture(gl, 11,'images/grass.jpg'),
	  initializeTexture(gl, 12,'images/sand.png'),
	  initializeTexture(gl, 15,'images/snow.png'),
	  initializeTexture(gl, 13,'images/water_normal.jpg')])    
	  .then(function () {requestAnimationFrame(tick);})
      .catch(function (error) {alert('Failed to load texture '+  error.message);});
	
}

//Taken from EXAMPLES - animation
var last = Date.now();
function update(angle) {
    var now = Date.now();
    var elapsed = now - last;
    last = now;
    var newAngle = angle + (10*elapsed)/ 1000.0;
	return newAngle;
}
