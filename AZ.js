const gameMaze = document.getElementById('AZmaze');

var maze = {
    row: 81,
    col: 81,
    tank_size: 5,
    length_gun: 2,
    wall_length: 10,
    bullet_time: 7500,
    reset_time: 100
    // only generate walls when row and col % wall.length = 1.
};

var osu, cur_mode, score_player_1 = 0, score_player_2 = 0, p_score_player_1 = 0, p_score_player_2 = 0, cur_time, fire_time_p1, fire_time_p2, 
p1_x, p1_y, p2_x, p2_y, p1_direction, p2_direction, gun_p1_x, gun_p1_y, gun_p2_x, gun_p2_y,
bullet_p1_x, bullet_p1_y, bullet_p2_x, bullet_p2_y, bullet_direction_p1, bullet_direction_p2;

let state = new Array(maze.row + 5);
let visit = new Array(maze.row + 5);
for(var i = 0; i <= maze.row + 4; i++){
    state[i] = new Array(maze.col + 5).fill(0);
    visit[i] = new Array(maze.col + 5).fill(0);
}

function rng(l, r){
    return Math.floor(Math.random() * (r - l + 1)) + l;
}

function hash(i, j){
	return (i - 1) * maze.col + j;
}

function shuffle(array){
    var size = array.length
    for(var i = 0; i < size - 1; i++){
        var index = rng(i + 1, size - 1);
        var tmp = array[i];
        array[i] = array[index];
        array[index] = tmp;
    }
    return array;
}

function add_horizontal(x, y){
    // console.log(x, y, x, y + maze.wall_length - 1, "ADD");
    for(var i = y; i <= y + maze.wall_length - 1; i++) state[x][i] = 1;
}
function erase_horizontal(x, y){
    if(x == 1 || x == maze.row) return;
    // console.log(x, y, x, y + maze.wall_length - 1, "ERASE");
    for(var i = y; i <= y + maze.wall_length - 1; i++) state[x][i] = 0;
    if(y == 1) state[x][y] = 1;
}
function add_vertical(x, y){
    // console.log(x, y, x + maze.wall_length - 1, y, "ADD");
    for(var i = x; i <= x + maze.wall_length - 1; i++) state[i][y] = 1;
}
function erase_vertical(x, y){
    if(y == 1 || y == maze.col) return;
    // console.log(x, y, x + maze.wall_length - 1, y, "ERASE");
    for(var i = x; i <= x + maze.wall_length - 1; i++) state[i][y] = 0;
    if(x == 1) state[x][y] = 1;
}
function add_edge(i, j, val){
    if(val == 0) return true;
    if(val == 1) add_horizontal(i, j);
    else if(val == 2) add_vertical(i, j);
    else add_horizontal(i, j), add_vertical(i, j);
    if(check() == true) return true;
    if(val == 1) erase_horizontal(i, j);
    else if(val == 2) erase_vertical(i, j);
    else erase_horizontal(i, j), erase_vertical(i, j);
    return false;
}
function generate_maze(){
    for(var i = 1; i <= maze.row; i++) state[i][1] = state[i][maze.col] = 1;
    for(var i = 1; i <= maze.col; i++) state[1][i] = state[maze.col][i] = 1;
    let array = [];
    for(var i = 1; i < maze.row; i += maze.wall_length){
        for(var j = 1; j < maze.col; j += maze.wall_length){
            array.push(hash(i, j));
        }
    }
    shuffle(array);
    for(var order = 0; order < array.length; order++){
        var i = Math.floor((array[order] - 1) / maze.col) + 1, j = array[order] % maze.col;
        // console.log(i, j);
        if(i != 1){
            let num = [0, 1, 2, 3];  // 1 = _, 2 = |, 3 = | + _
            shuffle(num);
            for(var k = 0; k < 4; k++){
                if(add_edge(i, j, num[k]) == true) break;
            }
        }
        else{
            if(j == 1) continue;
            let num = [0, 2];
            shuffle(num);
            for(var k = 0; k < 2; k++){
                if(add_edge(i, j, num[k]) == true) break;
            }
        }
    }
    for(var i = 1; i <= maze.row; i++){
        for(var j = 1; j <= maze.col; j++){
            var cnt = 0;
            if(i % maze.wall_length == 1 && j % maze.wall_length == 1){
                if(i == 1 || j == 1 || i == maze.row || j == maze.col);
                else{
                    for(var x = -1; x <= 1; x++){
                        for(var y = -1; y <= 1; y++){
                            if(x && y) continue;
                            if(!x && !y) continue;
                            if(i + x > maze.row || i + x < 1 || j + y > maze.col || j + y < 1) continue;
                            cnt += state[i + x][j + y];
                        }
                    }
                }
            }
            if(cnt >= 2) state[i][j] = 1;
            if(state[i][j]){
                let cell = document.getElementById(hash(i, j));
                cell.style.backgroundColor = "black";
            }
            // console.log(i, j, state[i][j]);
        }
    }
}

function reset_all(mode){
    fire_time_p1 = fire_time_p2 = 0;
    p_score_player_1 = score_player_1; p_score_player_2 = score_player_2;
    gameMaze.innerHTML = '';
    if(!cur_mode){
        score_player_1 = score_player_2 = p_score_player_1 = p_score_player_2 = 0;
        update_score();
    }
    for(var i = 1; i <= maze.row; i++){
        for(var j = 1; j <= maze.col; j++){
            state[i][j] = visit[i][j] = 0;
        }
    }
}

function dfs(x, y){
    // console.log(x, y);
    visit[x][y] = 1;
    for(var i = -1; i <= 1; i++){
        for(var j = -1; j <= 1; j++){
            if(i && j) continue;
            if(!i && !j) continue;
            if(i + x > maze.row || i + x < 1 || j + y > maze.col || j + y < 1) continue;
            if(visit[i + x][j + y]) continue;
            dfs(i + x, j + y);
        }
    }
}

function check(){
    var flag = 0;
    for(var i = 1; i <= maze.row; i++){
        for(var j = 1; j <= maze.col; j++){
            visit[i][j] = state[i][j];
        }
    }
    for(var i = 1; i <= maze.row; i++){
        for(var j = 1; j <= maze.col; j++){
            if(!visit[i][j]){
                if(!flag) flag = 1, dfs(i, j);
                else return false;
            }
        }
    }
    return true;
}

// direction: 0 = up, 2 = right, 4 = down, 6 = left 
function create_gun(x, y, d){
    if(d == 0){
        for(var i = x; i <= x + maze.length_gun - 1; i++){
            for(var j = y; j <= y + maze.tank_size - 1; j++){
                if(j - y == 2) continue;
                state[i][j] = 0;
                let cell = document.getElementById(hash(i, j));
                cell.style.backgroundColor = "white";
            }
        }
    }
    if(d == 2){
        for(var j = y + maze.tank_size - maze.length_gun; j <= y + maze.tank_size - 1; j++){
            for(var i = x; i <= x + maze.tank_size - 1; i++){
                if(i - x == 2) continue;
                state[i][j] = 0;
                let cell = document.getElementById(hash(i, j));
                cell.style.backgroundColor = "white";
            }
        }
    }
    if(d == 4){
        for(var i = x + maze.tank_size - maze.length_gun; i <= x + maze.tank_size - 1; i++){
            for(var j = y; j <= y + maze.tank_size - 1; j++){
                if(j - y == 2) continue;
                state[i][j] = 0;
                let cell = document.getElementById(hash(i, j));
                cell.style.backgroundColor = "white";
            }
        }
    }
    if(d == 6){
        for(var j = y; j <= y + maze.length_gun - 1; j++){
            for(var i = x; i <= x + maze.tank_size - 1; i++){
                if(i - x == 2) continue;
                state[i][j] = 0;
                let cell = document.getElementById(hash(i, j));
                cell.style.backgroundColor = "white";
            }
        }
    }
    if(d == 1){
        for(var i = x; i <= x + maze.tank_size - 1; i++){
            for(var j = y; j <= y + maze.tank_size - 1; j++){
                if(i - j > x - y || 
                (i == x && j == y + maze.tank_size - maze.length_gun) || 
                (i == x + maze.length_gun - 1 && j == y + maze.tank_size - 1)){
                    state[i][j] = 0;
                    let cell = document.getElementById(hash(i, j));
                    cell.style.backgroundColor = "white";
                }
            }
        }
    }
    if(d == 3){
        for(var i = x; i <= x + maze.tank_size - 1; i++){
            for(var j = y; j <= y + maze.tank_size - 1; j++){
                if(i + j < x + y + maze.tank_size - 1 || 
                (i == x + maze.tank_size - maze.length_gun && j == y + maze.tank_size - 1) || 
                (i == x + maze.tank_size - 1 && j == y + maze.tank_size - maze.length_gun)){
                    state[i][j] = 0;
                    let cell = document.getElementById(hash(i, j));
                    cell.style.backgroundColor = "white";
                }
            }
        }
    }
    if(d == 5){
        for(var i = x; i <= x + maze.tank_size - 1; i++){
            for(var j = y; j <= y + maze.tank_size - 1; j++){
                if(i - j < x - y || 
                (i == x + maze.tank_size - 1 && j == y + maze.length_gun - 1) || 
                (i == x + maze.tank_size - maze.length_gun && j == y)){
                    state[i][j] = 0;
                    let cell = document.getElementById(hash(i, j));
                    cell.style.backgroundColor = "white";
                }
            }
        }
    }
    if(d == 7){
        for(var i = x; i <= x + maze.tank_size - 1; i++){
            for(var j = y; j <= y + maze.tank_size - 1; j++){
                if(i + j > x + y + maze.tank_size - 1 || 
                (i == x + maze.length_gun - 1 && j == y) || 
                (i == x && j == y + maze.length_gun - 1)){
                    state[i][j] = 0;
                    let cell = document.getElementById(hash(i, j));
                    cell.style.backgroundColor = "white";
                }
            }
        }
    }
}

function rotate_45(player){
    if(player == 1){
        delete_p1_tank(); p1_direction++;
        if(p1_direction >= 8) p1_direction -= 8;
        get_p1_tank();
    }
    else{
        delete_p2_tank(); p2_direction++;
        if(p2_direction >= 8) p2_direction -= 8;
        get_p2_tank();
    }
}

// direction: 0 = up, 2 = right, 4 = down, 6 = left 

function intersect(player){
    if(player == 1){
        for(var i = p1_x; i <= p1_x + maze.tank_size - 1; i++){
            for(var j = p1_y; j <= p1_y + maze.tank_size - 1; j++){
                if(state[i][j] == 1 || state[i][j] == 3) return true;
            }
        }
        return false;
    }
    else{
        for(var i = p2_x; i <= p2_x + maze.tank_size - 1; i++){
            for(var j = p2_y; j <= p2_y + maze.tank_size - 1; j++){
                if(state[i][j] == 1 || state[i][j] == 2) return true;
            }
        }
        return false;
    }
}

function move_backward(player){
    if(player == 1){
        delete_p1_tank();
        if(p1_direction == 0){
            p1_x++;
            if(p1_x > maze.row || intersect(1)) p1_x--;
        }
        if(p1_direction == 2){
            p1_y--;
            if(p1_y < 1 || intersect(1)) p1_y++;
        }
        if(p1_direction == 4){
            p1_x--;
            if(p1_x < 1 || intersect(1)) p1_x++;
        }
        if(p1_direction == 6){
            p1_y++;
            if(p1_y > maze.col || intersect(1)) p1_y--;
        }
        if(p1_direction == 5){
            p1_x--; p1_y++;
            if(p1_x < 1 || p1_y > maze.col || intersect(1)) p1_x++, p1_y--;
        }
        if(p1_direction == 7){
            p1_x++; p1_y++;
            if(p1_x > maze.row || p1_y > maze.col || intersect(1)) p1_x--, p1_y--;
        }
        if(p1_direction == 1){
            p1_x++; p1_y--;
            if(p1_x > maze.row || p1_y < 1 || intersect(1)) p1_x--, p1_y++;
        }
        if(p1_direction == 3){
            p1_x--; p1_y--;
            if(p1_x < 1 || p1_y < 1 || intersect(1)) p1_x++, p1_y++;
        }
        get_p1_tank();
    }
    else{
        delete_p2_tank();
        if(p2_direction == 0){
            p2_x++;
            if(p2_x > maze.row || intersect(2)) p2_x--;
        }
        if(p2_direction == 2){
            p2_y--;
            if(p2_y < 1 || intersect(2)) p2_y++;
        }
        if(p2_direction == 4){
            p2_x--;
            if(p2_x < 1 || intersect(2)) p2_x++;
        }
        if(p2_direction == 6){
            p2_y++;
            if(p2_y > maze.col || intersect(2)) p2_y--;
        }
        if(p2_direction == 5){
            p2_x--; p2_y++;
            if(p2_x < 1 || p2_y > maze.col || intersect(2)) p2_x++, p2_y--;
        }
        if(p2_direction == 7){
            p2_x++; p2_y++;
            if(p2_x > maze.row || p2_y > maze.col || intersect(2)) p2_x--, p2_y--;
        }
        if(p2_direction == 1){
            p2_x++; p2_y--;
            if(p2_x > maze.row || p2_y < 1 || intersect(2)) p2_x--, p2_y++;
        }
        if(p2_direction == 3){
            p2_x--; p2_y--;
            if(p2_x < 1 || p2_y < 1 || intersect(2)) p2_x++, p2_y++;
        }
        get_p2_tank();
    }
}

// direction: 0 = up, 2 = right, 4 = down, 6 = left 
function move_forward(player){
    if(player == 1){
        // console.log(p1_x, p1_y, p1_direction);
        delete_p1_tank();
        if(p1_direction == 4){
            p1_x++;
            if(p1_x + maze.tank_size > maze.row || intersect(1)) p1_x--;
        }
        if(p1_direction == 6){
            p1_y--;
            if(p1_y < 1 || intersect(1)) p1_y++;
        }
        if(p1_direction == 0){
            p1_x--;
            if(p1_x < 1 || intersect(1)) p1_x++;
        }
        if(p1_direction == 2){
            p1_y++;
            if(p1_y + maze.tank_size > maze.col || intersect(1)) p1_y--;
        }
        if(p1_direction == 1){
            p1_x--; p1_y++;
            if(p1_x < 1 || p1_y + maze.tank_size > maze.col || intersect(1)) p1_x++, p1_y--;
        }
        if(p1_direction == 3){
            p1_x++; p1_y++;
            if(p1_x + maze.tank_size > maze.row || p1_y + maze.tank_size > maze.col || intersect(1)) p1_x--, p1_y--;
        }
        if(p1_direction == 5){
            p1_x++; p1_y--;
            if(p1_x + maze.tank_size > maze.row || p1_y < 1 || intersect(1)) p1_x--, p1_y++;
        }
        if(p1_direction == 7){
            p1_x--; p1_y--;
            if(p1_x < 1 || p1_y < 1 || intersect(1)) p1_x++, p1_y++;
        }
        get_p1_tank();
    }
    else{
        delete_p2_tank();
        if(p2_direction == 4){
            p2_x++;
            if(p2_x + maze.tank_size > maze.row || intersect(2)) p2_x--;
        }
        if(p2_direction == 6){
            p2_y--;
            if(p2_y < 1 || intersect(2)) p2_y++;
        }
        if(p2_direction == 0){
            p2_x--;
            if(p2_x < 1 || intersect(2)) p2_x++;
        }
        if(p2_direction == 2){
            p2_y++;
            if(p2_y + maze.tank_size > maze.col || intersect(2)) p2_y--;
        }
        if(p2_direction == 1){
            p2_x--; p2_y++;
            if(p2_x < 1 || p2_y + maze.tank_size > maze.col || intersect(2)) p2_x++, p2_y--;
        }
        if(p2_direction == 3){
            p2_x++; p2_y++;
            if(p2_x + maze.tank_size > maze.row || p2_y + maze.tank_size > maze.col || intersect(2)) p2_x--, p2_y--;
        }
        if(p2_direction == 5){
            p2_x++; p2_y--;
            if(p2_x + maze.tank_size > maze.row || p2_y < 1 || intersect(2)) p2_x--, p2_y++;
        }
        if(p2_direction == 7){
            p2_x--; p2_y--;
            if(p2_x < 1 || p2_y < 1 || intersect(2)) p2_x++, p2_y++;
        }
        get_p2_tank();
    }
}

function get_p1_tank(){
    if(p1_x == 0) return;
    for(var i = p1_x; i <= p1_x + maze.tank_size - 1; i++){
        for(var j = p1_y; j <= p1_y + maze.tank_size - 1; j++){
            state[i][j] = 2;
            let cell = document.getElementById(hash(i, j));
            cell.style.backgroundColor = "green";
        }
    }
    create_gun(p1_x, p1_y, p1_direction);
    var x = p1_x, y = p1_y;
    if(p1_direction == 0) gun_p1_x = x, gun_p1_y = y + 2;
    if(p1_direction == 1) gun_p1_x = x, gun_p1_y = y + 4;
    if(p1_direction == 2) gun_p1_x = x + 2, gun_p1_y = y + 4;
    if(p1_direction == 3) gun_p1_x = x + 4, gun_p1_y = y + 4;
    if(p1_direction == 4) gun_p1_x = x + 4, gun_p1_y = y + 2;
    if(p1_direction == 5) gun_p1_x = x + 4, gun_p1_y = y;
    if(p1_direction == 6) gun_p1_x = x + 2, gun_p1_y = y;
    if(p1_direction == 7) gun_p1_x = x, gun_p1_y = y;
}
function delete_p1_tank(){
    if(p1_x == 0) return;
    for(var i = p1_x; i <= p1_x + maze.tank_size - 1; i++){
        for(var j = p1_y; j <= p1_y + maze.tank_size - 1; j++){
            state[i][j] = 0;
            if(i < 1 || j < 1){
                console.log("OSU! ", i, j);
            }
            let cell = document.getElementById(hash(i, j));
            cell.style.backgroundColor = "white";
        }
    }
}
function get_p2_tank(){
    if(p2_x == 0) return;
    for(var i = p2_x; i <= p2_x + maze.tank_size - 1; i++){
        for(var j = p2_y; j <= p2_y + maze.tank_size - 1; j++){
            state[i][j] = 3;
            let cell = document.getElementById(hash(i, j));
            cell.style.backgroundColor = "red";
        }
    }
    create_gun(p2_x, p2_y, p2_direction);
    var x = p2_x, y = p2_y;
    if(p2_direction == 0) gun_p2_x = x, gun_p2_y = y + 2;
    if(p2_direction == 1) gun_p2_x = x, gun_p2_y = y + 4;
    if(p2_direction == 2) gun_p2_x = x + 2, gun_p2_y = y + 4;
    if(p2_direction == 3) gun_p2_x = x + 4, gun_p2_y = y + 4;
    if(p2_direction == 4) gun_p2_x = x + 4, gun_p2_y = y + 2;
    if(p2_direction == 5) gun_p2_x = x + 4, gun_p2_y = y;
    if(p2_direction == 6) gun_p2_x = x + 2, gun_p2_y = y;
    if(p2_direction == 7) gun_p2_x = x, gun_p2_y = y;
}
function delete_p2_tank(){
    if(p2_x == 0) return;
    for(var i = p2_x; i <= p2_x + maze.tank_size - 1; i++){
        for(var j = p2_y; j <= p2_y + maze.tank_size - 1; j++){
            state[i][j] = 0;
            let cell = document.getElementById(hash(i, j));
            cell.style.backgroundColor = "white";
        }
    }
}

function generate_tank(){
    var x = Math.floor(maze.row / maze.wall_length), y = Math.floor(maze.row / maze.wall_length);
    p1_x = rng(0, Math.floor(x / 3) - 1) * maze.wall_length + 1 + rng(1, maze.wall_length - maze.tank_size);
    p1_y = rng(0, Math.floor(y / 3) - 1) * maze.wall_length + 1 + rng(1, maze.wall_length - maze.tank_size);
    p2_x = rng(x - Math.floor(x / 3) - 1, x - 1) * maze.wall_length + 1 + rng(1, maze.wall_length - maze.tank_size);
    p2_y = rng(y - Math.floor(x / 3) - 1, y - 1)  * maze.wall_length + 1 + rng(1, maze.wall_length - maze.tank_size);
    p1_direction = rng(0, 7); p2_direction = rng(0, 7);
    get_p1_tank(); 
    get_p2_tank();
}

function update_score(){
    let score = document.getElementById("Score_p1");
    score.textContent = score_player_1;
    score = document.getElementById("Score_p2");
    score.textContent = score_player_2;
}

function end_game(player){
    update_bullet(1, false); update_bullet(2, false); clearInterval(osu);
    if(player == 1){
        score_player_1++; delete_p2_tank();
        p1_x = p1_y = p2_x = p2_y = 0;
    }
    else{
        score_player_2++; delete_p1_tank();
        p1_x = p1_y = p2_x = p2_y = 0;
    }
    update_score(); return;
}
// let key = [87, 65, 68, 83, 12, 35, 34, 40];
function updated(){
    if(p_score_player_1 != score_player_1 || p_score_player_2 != score_player_2){
        update_bullet(1, false); update_bullet(2, false);
        return true;
    }
    return false;
}
function update_bullet(player, flag){
    if(player == 1){
        for(var i = bullet_p1_x - 1; i <= bullet_p1_x + 1; i++){
            for(var j = bullet_p1_y - 1; j <= bullet_p1_y + 1; j++){
                if(i < 1 || i > maze.row || j < 1 || j > maze.col) continue;
                if(state[i][j] == 4){
                    let cell = document.getElementById(hash(i, j));
                    // console.log("OSU: ", hash(i, j), i, j, p1_x, p1_y);
                    state[i][j] = 0; cell.style.backgroundColor = "white";
                }
            }
        }
        if(flag == true){
            let cell = document.getElementById(hash(bullet_p1_x, bullet_p1_y));
            // console.log(bullet_p1_x, bullet_p1_y, state[bullet_p1_x][bullet_p1_y]);
            if(state[bullet_p1_x][bullet_p1_y] == 2){
                end_game(2); return;
            }
            else if(state[bullet_p1_x][bullet_p1_y] == 3){
                end_game(1); return;
            }
            state[bullet_p1_x][bullet_p1_y] = 4; cell.style.backgroundColor = "gray";
        }
    }
    else{
        for(var i = bullet_p2_x - 1; i <= bullet_p2_x + 1; i++){
            for(var j = bullet_p2_y - 1; j <= bullet_p2_y + 1; j++){
                if(i < 1 || i > maze.row || j < 1 || j > maze.col) continue;
                if(state[i][j] == 5){
                    let cell = document.getElementById(hash(i, j));
                    state[i][j] = 0; cell.style.backgroundColor = "white";
                }
            }
        }
        if(flag == true){
            let cell = document.getElementById(hash(bullet_p2_x, bullet_p2_y));
            if(state[bullet_p2_x][bullet_p2_y] == 2){
                end_game(2); return;
            }
            else if(state[bullet_p2_x][bullet_p2_y] == 3){
                end_game(1); return;
            }
            state[bullet_p2_x][bullet_p2_y] = 5; cell.style.backgroundColor = "gray";
        }
    }
}
function time_elapsed(){
    osu = setInterval(function() {
        cur_time = Date.now();
        // console.log(cur_time);
    }, maze.reset_time);
}

function fire(player){
    if(player == 1){
        if(!fire_time_p1 || cur_time - fire_time_p1 > maze.bullet_time){
            fire_time_p1 = cur_time;
            bullet_p1_x = gun_p1_x, bullet_p1_y = gun_p1_y; bullet_direction_p1 = p1_direction;
            var lap = setInterval(function() {
                // lap++;
                // console.log(lap);
                if(lap > maze.bullet_time / maze.reset_time) clearInterval(lap);
                if(updated() == true) clearInterval(lap);
                var cnt = Date.now() - fire_time_p1;
                // console.log(cnt);
                if(cnt > maze.bullet_time){
                    update_bullet(1, false); clearInterval(lap);
                }
                else if(bullet_direction_p1 == 4){
                    bullet_p1_x++;
                    if(state[bullet_p1_x][bullet_p1_y] == 1){
                        bullet_p1_x--; bullet_direction_p1 -= 4;
                    }
                    update_bullet(1, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p1 == 6){
                    bullet_p1_y--;
                    if(state[bullet_p1_x][bullet_p1_y] == 1){
                        bullet_p1_y++; bullet_direction_p1 -= 4;
                    }
                    update_bullet(1, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p1 == 0){
                    bullet_p1_x--;
                    if(state[bullet_p1_x][bullet_p1_y] == 1){
                        bullet_p1_x++; bullet_direction_p1 += 4;
                    }
                    update_bullet(1, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p1 == 2){
                    bullet_p1_y++;
                    if(state[bullet_p1_x][bullet_p1_y] == 1){
                        bullet_p1_y--; bullet_direction_p1 += 4;
                    }
                    update_bullet(1, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p1 == 1){
                    bullet_p1_x--; bullet_p1_y++;
                    if(state[bullet_p1_x][bullet_p1_y] == 1 && state[bullet_p1_x][bullet_p1_y - 1] == 1 && state[bullet_p1_x + 1][bullet_p1_y] == 1){
                        bullet_p1_x++, bullet_p1_y--; bullet_direction_p1 = 5;
                    }
                    else if(state[bullet_p1_x][bullet_p1_y] == 1 && (state[bullet_p1_x - 1][bullet_p1_y] == 1 || state[bullet_p1_x + 1][bullet_p1_y] == 1)){   
                        bullet_p1_x++, bullet_p1_y--; bullet_direction_p1 = 7;
                    }
                    else if(state[bullet_p1_x][bullet_p1_y] == 1 && (state[bullet_p1_x][bullet_p1_y - 1] == 1 || state[bullet_p1_x][bullet_p1_y + 1] == 1)){   
                        bullet_p1_x++, bullet_p1_y--; bullet_direction_p1 = 3;
                    }
                    update_bullet(1, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p1 == 3){
                    bullet_p1_x++; bullet_p1_y++;
                    if(state[bullet_p1_x][bullet_p1_y] == 1 && state[bullet_p1_x][bullet_p1_y - 1] == 1 && state[bullet_p1_x - 1][bullet_p1_y] == 1){
                        bullet_p1_x--, bullet_p1_y--; bullet_direction_p1 = 7;
                    }
                    else if(state[bullet_p1_x][bullet_p1_y] == 1 && (state[bullet_p1_x - 1][bullet_p1_y] == 1 || state[bullet_p1_x + 1][bullet_p1_y] == 1)){
                        bullet_p1_x--, bullet_p1_y--; bullet_direction_p1 = 5;
                    }
                    else if(state[bullet_p1_x][bullet_p1_y] == 1 && (state[bullet_p1_x][bullet_p1_y - 1] == 1 || state[bullet_p1_x][bullet_p1_y + 1] == 1)){
                        bullet_p1_x--, bullet_p1_y--; bullet_direction_p1 = 1;
                    }
                    update_bullet(1, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p1 == 5){
                    bullet_p1_x++; bullet_p1_y--;
                    if(state[bullet_p1_x][bullet_p1_y] == 1 && state[bullet_p1_x - 1][bullet_p1_y] == 1 && state[bullet_p1_x][bullet_p1_y + 1] == 1){
                        bullet_p1_x--, bullet_p1_y++; bullet_direction_p1 = 1;
                    }
                    else if(state[bullet_p1_x][bullet_p1_y] == 1 && (state[bullet_p1_x - 1][bullet_p1_y] == 1 || state[bullet_p1_x + 1][bullet_p1_y] == 1)){
                        bullet_p1_x--, bullet_p1_y++; bullet_direction_p1 = 3;
                    }
                    else if(state[bullet_p1_x][bullet_p1_y] == 1 && (state[bullet_p1_x][bullet_p1_y - 1] == 1 || state[bullet_p1_x][bullet_p1_y + 1] == 1)){
                        bullet_p1_x--, bullet_p1_y++; bullet_direction_p1 = 7;
                    }
                    update_bullet(1, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p1 == 7){
                    bullet_p1_x--; bullet_p1_y--;
                    if(state[bullet_p1_x][bullet_p1_y] == 1 && state[bullet_p1_x + 1][bullet_p1_y] == 1 && state[bullet_p1_x][bullet_p1_y + 1] == 1){
                        bullet_p1_x++, bullet_p1_y++; bullet_direction_p1 = 3;
                    }
                    else if(state[bullet_p1_x][bullet_p1_y] == 1 && (state[bullet_p1_x - 1][bullet_p1_y] == 1 || state[bullet_p1_x + 1][bullet_p1_y] == 1)){
                        bullet_p1_x++, bullet_p1_y++; bullet_direction_p1 = 1;
                    }
                    else if(state[bullet_p1_x][bullet_p1_y] == 1 && (state[bullet_p1_x][bullet_p1_y - 1] == 1 || state[bullet_p1_x][bullet_p1_y + 1] == 1)){
                        bullet_p1_x++, bullet_p1_y++; bullet_direction_p1 = 5;
                    }
                    update_bullet(1, true);
                    if(updated() == true) clearInterval(lap);
                }
                // console.log(cur_time);
            }, maze.reset_time);
        }
        else return;
    }
    else{
        if(!fire_time_p2 || cur_time - fire_time_p2 > maze.bullet_time){
            fire_time_p2 = cur_time;
            bullet_p2_x = gun_p2_x, bullet_p2_y = gun_p2_y; bullet_direction_p2 = p2_direction;
            var lap = setInterval(function() {
                if(updated() == true) clearInterval(lap);
                var cnt = Date.now() - fire_time_p2;
                // console.log(cnt);
                if(cnt > maze.bullet_time){
                    update_bullet(2, false); clearInterval(lap);
                }
                else if(bullet_direction_p2 == 4){
                    bullet_p2_x++;
                    if(state[bullet_p2_x][bullet_p2_y] == 1){
                        bullet_p2_x--; bullet_direction_p2 -= 4;
                    }
                    update_bullet(2, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p2 == 6){
                    bullet_p2_y--;
                    if(state[bullet_p2_x][bullet_p2_y] == 1){
                        bullet_p2_y++; bullet_direction_p2 -= 4;
                    }
                    update_bullet(2, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p2 == 0){
                    bullet_p2_x--;
                    if(state[bullet_p2_x][bullet_p2_y] == 1){
                        bullet_p2_x++; bullet_direction_p2 += 4;
                    }
                    update_bullet(2, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p2 == 2){
                    bullet_p2_y++;
                    if(state[bullet_p2_x][bullet_p2_y] == 1){
                        bullet_p2_y--; bullet_direction_p2 += 4;
                    }
                    update_bullet(2, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p2 == 1){
                    bullet_p2_x--; bullet_p2_y++;
                    if(state[bullet_p2_x][bullet_p2_y] == 1 && state[bullet_p2_x][bullet_p2_y - 1] == 1 && state[bullet_p2_x + 1][bullet_p2_y] == 1){
                        bullet_p2_x++, bullet_p2_y--; bullet_direction_p2 = 5;
                    }
                    else if(state[bullet_p2_x][bullet_p2_y] == 1 && (state[bullet_p2_x - 1][bullet_p2_y] == 1 || state[bullet_p2_x + 1][bullet_p2_y] == 1)){   
                        bullet_p2_x++, bullet_p2_y--; bullet_direction_p2 = 7;
                    }
                    else if(state[bullet_p2_x][bullet_p2_y] == 1 && (state[bullet_p2_x][bullet_p2_y - 1] == 1 || state[bullet_p2_x][bullet_p2_y + 1] == 1)){   
                        bullet_p2_x++, bullet_p2_y--; bullet_direction_p2 = 3;
                    }
                    update_bullet(2, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p2 == 3){
                    bullet_p2_x++; bullet_p2_y++;
                    if(state[bullet_p2_x][bullet_p2_y] == 1 && state[bullet_p2_x][bullet_p2_y - 1] == 1 && state[bullet_p2_x - 1][bullet_p2_y] == 1){
                        bullet_p2_x--, bullet_p2_y--; bullet_direction_p2 = 7;
                    }
                    else if(state[bullet_p2_x][bullet_p2_y] == 1 && (state[bullet_p2_x - 1][bullet_p2_y] == 1 || state[bullet_p2_x + 1][bullet_p2_y] == 1)){
                        bullet_p2_x--, bullet_p2_y--; bullet_direction_p2 = 5;
                    }
                    else if(state[bullet_p2_x][bullet_p2_y] == 1 && (state[bullet_p2_x][bullet_p2_y - 1] == 1 || state[bullet_p2_x][bullet_p2_y + 1] == 1)){
                        bullet_p2_x--, bullet_p2_y--; bullet_direction_p2 = 1;
                    }
                    update_bullet(2, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p2 == 5){
                    bullet_p2_x++; bullet_p2_y--;
                    if(state[bullet_p2_x][bullet_p2_y] == 1 && state[bullet_p2_x - 1][bullet_p2_y] == 1 && state[bullet_p2_x][bullet_p2_y + 1] == 1){
                        bullet_p2_x--, bullet_p2_y++; bullet_direction_p2 = 1;
                    }
                    else if(state[bullet_p2_x][bullet_p2_y] == 1 && (state[bullet_p2_x - 1][bullet_p2_y] == 1 || state[bullet_p2_x + 1][bullet_p2_y] == 1)){
                        bullet_p2_x--, bullet_p2_y++; bullet_direction_p2 = 3;
                    }
                    else if(state[bullet_p2_x][bullet_p2_y] == 1 && (state[bullet_p2_x][bullet_p2_y - 1] == 1 || state[bullet_p2_x][bullet_p2_y + 1] == 1)){
                        bullet_p2_x--, bullet_p2_y++; bullet_direction_p2 = 7;
                    }
                    update_bullet(2, true);
                    if(updated() == true) clearInterval(lap);
                }
                else if(bullet_direction_p2 == 7){
                    bullet_p2_x--; bullet_p2_y--;
                    if(state[bullet_p2_x][bullet_p2_y] == 1 && state[bullet_p2_x + 1][bullet_p2_y] == 1 && state[bullet_p2_x][bullet_p2_y + 1] == 1){
                        bullet_p2_x++, bullet_p2_y++; bullet_direction_p2 = 3;
                    }
                    else if(state[bullet_p2_x][bullet_p2_y] == 1 && (state[bullet_p2_x - 1][bullet_p2_y] == 1 || state[bullet_p2_x + 1][bullet_p2_y] == 1)){
                        bullet_p2_x++, bullet_p2_y++; bullet_direction_p2 = 1;
                    }
                    else if(state[bullet_p2_x][bullet_p2_y] == 1 && (state[bullet_p2_x][bullet_p2_y - 1] == 1 || state[bullet_p2_x][bullet_p2_y + 1] == 1)){
                        bullet_p2_x++, bullet_p2_y++; bullet_direction_p2 = 5;
                    }
                    update_bullet(2, true);
                    if(updated() == true) clearInterval(lap);
                }
                // console.log(cur_time);
            }, maze.reset_time);
        }
        else return;
    }
}

function init(mode){
    time_elapsed();
    cur_mode = mode;
    reset_all(mode);
    var table = document.createElement('table');
    for(var i = 1; i <= maze.row; i++){
        var row = document.createElement('tr');
        for(var j = 1; j <= maze.col; j++){
            let cell = document.createElement('td');
            cell.id = hash(i, j);
            cell.style.backgroundColor = "white";
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    gameMaze.appendChild(table);
    generate_maze();
    generate_tank();
}

document.onkeydown = (e) => {
    if(updated() == true) return;
    e = e || window.event;
    var num = e.keyCode
    console.log("KEY: ", num);
    if(e.keyCode == 87){ // w
        move_forward(1);
    }   
    if(e.keyCode == 65){ // a
        for(var i = 1; i <= 7; i++) rotate_45(1);
    }
    if(e.keyCode == 68){ // d
        rotate_45(1);
    }
    if(e.keyCode == 83){ // s;
        move_backward(1);
    }
    if(e.keyCode == 32){ // space
        fire(1);
    }
    if(e.keyCode == 12){ // 5  
        move_forward(2);
    }
    if(e.keyCode == 35){ // 1
        for(var i = 1; i <= 7; i++) rotate_45(2);
    }
    if(e.keyCode == 34){ // 3
        rotate_45(2);
    }
    if(e.keyCode == 40){ // 2;
        move_backward(2);
    }
    if(e.keyCode == 13){ // right enter
        fire(2);
    }
}
window.addEventListener('load', function(){
    init(0);
});

function New_game(){
	window.location.reload();
}
