const { json } = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: 'bdpw',
    database: 'deshidratador',
    port: '5432'
});

const register = async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const {rut, nombre, contrasena, correo, direccion } = req.body;
    const sqlQuery = 'INSERT INTO Usuarios (rut, nombre, contrasena, correo, direccion, tipo) values ($1, $2, $3, $4, $5, 1) RETURNING *';
    const values = [rut, nombre, contrasena, correo, direccion];
    const response = await pool.query(sqlQuery, values);
    console.log('Registrando usuario con los datos: \n', response.rows);
    res.json(1);
};

const modRegister = async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const tipo = req.tipo;
    if (tipo == 2){
        const {rut, nombre, contrasena, correo, direccion } = req.body;
        const sqlQuery = 'INSERT INTO Usuarios (rut, nombre, contrasena, correo, direccion, tipo) values ($1, $2, $3, $4, $5, 2) RETURNING *';
        const values = [rut, nombre, contrasena, correo, direccion];
        const response = await pool.query(sqlQuery, values);
        console.log('Registrando mod con los datos: \n', response.rows);
        res.json(1);
    } else {
        res.send('Permission error')
    }
};

const login = async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const { correo, contrasena } = req.body;
    const sqlQuery = 'SELECT count(*) FROM Usuarios WHERE correo = $1 and contrasena = $2';
    const values = [correo, contrasena];
    const response = await pool.query(sqlQuery, values);
    if (response.rows[0].count == '1'){ // usuario correcto
        const user = {
            correo,
            contrasena
        }
        jwt.sign({ user }, 'llavesecreta', (err, token) => {
            res.json({
                token
            })
        })
    }else{
        res.send('Error');
    }
}

const addConsulta = async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const { titulo, descripcion } = req.body;
    const sqlQuery = 'INSERT INTO Consultas (correo, estado, titulo, descripcion) VALUES ($1, false, $2, $3) RETURNING *';
    const correo = req.authData.user.correo;
    const values = [correo, titulo, descripcion];
    const response = await pool.query(sqlQuery,values);
    console.log('Insertando consulta siguiente: \n', response.rows);
    res.json(1);
}

const delConsulta = async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const { id } = req.body;
    const correo = req.authData.user.correo;
    const sqlQuery = 'delete from Consultas where id=$1 and correo = $2;'
    const response = await pool.query(sqlQuery,[id, correo]);
    console.log('Eliminando la consulta siguiente: \n', response.rows);
    res.json(1);
}

const getConsultas = async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const sqlQuery = 'SELECT id, titulo, descripcion, estado, respuesta FROM Consultas WHERE correo = $1;';
    const correo = req.authData.user.correo;
    const response = await pool.query(sqlQuery,[correo]);
    console.log(response.rows);
    res.json(response.rows);
}

const getUnsolveConsultas = async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const tipo = req.tipo;
    if (tipo == 2){
        const sqlQuery = 'SELECT id, titulo, descripcion FROM Consultas WHERE estado = false;';
        const response = await pool.query(sqlQuery);
        console.log(response.rows);
        res.json(response.rows);
    } else {
        res.send('permission error')
    }
}

const solveConsulta = async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const { id, respuesta } = req.body;
    const tipo = req.tipo;
    if (tipo == 2){
        const sqlQuery = 'UPDATE Consultas SET estado = true, respuesta = $1 WHERE id = $2;';
        const response = await pool.query(sqlQuery,[respuesta, id]);
        console.log('resolviendo consulta con id = :', id, '\n', response.rows);
        res.json(1);
    } else {
        res.send('permission error')
    }
}

const addDeshid = async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const { modelo } = req.body;
    const tipo = req.tipo;
    if (tipo == 2){
        const sqlQuery = 'INSERT INTO Artefactos (tipo, inProcess) values ($1, false) RETURNING *;';
        const values = [modelo];
        const response = await pool.query(sqlQuery, values);
        console.log('Añadiendo deshidratador: \n', response.rows);
        res.json(response.rows);
    } else {
        res.send('Permission error')
    }
}

const linkDeshid = async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const { id } = req.body;
    const correo = req.authData.user.correo;
    //TODO revisar que no este previamente linkeado
    const sqlQuery = 'UPDATE Artefactos SET correo = $1 WHERE id = $2 RETURNING *;';
    const values = [correo, id];
    const response = await pool.query(sqlQuery, values);
    console.log('enlazando deshidratador: \n', response.rows);
    res.json(response.rows);
}

const deslinkDeshid = async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const { id } = req.body;
    const correo = req.authData.user.correo;
    const sqlQuery = 'UPDATE Artefactos SET correo = null, inProcess = false, alimento = null WHERE correo = $1 AND id = $2 RETURNING *;';
    const values = [correo, id];
    const response = await pool.query(sqlQuery, values);
    console.log('desenlazando deshidratador: \n', response.rows);
    res.json(response.rows);
}

const getDeshid = async (req, res) => {
    
    res.header("Access-Control-Allow-Origin", "*");
    const correo = req.authData.user.correo;
    const sqlQuery = 'SELECT * FROM Artefactos WHERE correo = $1;';
    const values = [correo];
    const response = await pool.query(sqlQuery, values);
    console.log('mostrando deshidratadores: \n', response.rows);
    res.json(response.rows);
}

const startProcess = async (req, res) => {
    // inicia proceso de deshidratador
    res.header("Access-Control-Allow-Origin", "*");
    const { id, alimento } = req.body;
    const correo = req.authData.user.correo;
    const sqlQuery = 'UPDATE Artefactos SET inProcess = true, alimento = $1 WHERE correo = $2 AND id = $3;';
    const values = [alimento, correo, id];
    const response = await pool.query(sqlQuery, values);
    console.log('iniciando proceso: \n', response.rows);
    res.json(1);
}

const stopProcess = async (req, res) => {
    // detiene proceso de deshidratador
    res.header("Access-Control-Allow-Origin", "*");
    const { id } = req.body;
    const correo = req.authData.user.correo;
    const sqlQuery = 'UPDATE Artefactos SET inProcess = false WHERE correo = $1 AND id = $2;';
    const values = [correo, id];
    const response = await pool.query(sqlQuery, values);
    console.log('deteniendo proceso: \n', response.rows);
    res.json(1);
}

const getDato = async (req, res) => {
    // retorna dato actual del deshidratador
}

const getAllDato = async (req, res) => {
    // retorna datos historicos del deshidratador
}

const addDato = async (req, res) => {
    // falta revisar
    res.header("Access-Control-Allow-Origin", "*");
    const { id, tiempo, humedad, temperatura, peso, gas } = req.body;
    const sqlQuery = 'INSERT INTO Datos ( id_artefacto, tiempo, humedad, temperatura, peso, gas, alimento) values ($1, $2, $3, $4, $5, $6) RETURNING *';
    const alimento = ""; // por definir
    const values = [id, tiempo, humedad, temperatura, peso, gas, alimento];
    const response = await pool.query(sqlQuery, values);
    console.log('Añadiendo dato: \n', response.rows);
    res.json(1);
}

const act = async (req, res) => {
    // envia instruccion al actuador
}



const verifytoken = async (req, res, next) => {
    const bearer = req.headers['authorization'];
    let verify = false;
    if(typeof bearer !== 'undefined'){
        tok = bearer.split(" ")[1];
        jwt.verify(tok, 'llavesecreta', (error, authData) => {
            if (error){
                res.send('badToken');
            }else{
                verify = true;
                req.authData = authData;
            }
        });
        if (verify) {
            const sqlQuery = 'SELECT tipo FROM Usuarios WHERE correo = $1 AND contrasena = $2;';
            const correo = req.authData.user.correo;
            const contrasena = req.authData.user.contrasena;
            const values = [ correo, contrasena ];
            const response = await pool.query(sqlQuery, values);
            req.tipo = response.rows[0].tipo;
            next();
        }
    }else{
        res.send('missToken');
    }
}

module.exports = {
    verifytoken,
    register,
    modRegister,
    login,
    addConsulta,
    delConsulta,
    getConsultas,
    getUnsolveConsultas,
    solveConsulta,
    addDato,
    addDeshid,
    linkDeshid,
    deslinkDeshid,
    getDeshid,
    getDato,
    getAllDato,
    startProcess,
    stopProcess,
    act
};