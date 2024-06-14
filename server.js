const express = require('express');
const mysql = require('mysql2');
const cors = require('cors')
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const db = mysql.createConnection({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

db.connect(error => {
    if(error){
        console.error(
            'Erro ao conectar com o banco de dados', error);
        return;
    }
    console.log('Conectado com o banco de dados!');
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
}))

const authenticateSession = (req, res, next) => {
    if(!req.session.userID) {
        return res.status(401).send('Acesso negado, refaça o login seu virgem');
    }
    next();
}

app.post('/login', (req, res) => {
    const{cpf, senha} = req.body;

    db.query('SELECT * FROM usuarios WHERE cpf = ?', [cpf], async (err, results) => {
        if(err) return res.status(500). send('Server com erro');
        if(results.length === 0) return res.status(500).send('Cpf ou senha incorretos')

            const usuario = results[0];
            const senhaCorreta = await bcrypt.compare(senha, usuario.senha)
            if(!senhaCorreta) return res.status(500).send('Cpf ou senha incorretos');

                req.session.userID = usuario.idUsuarios;
                console.log('idUsuario')
                res.json({message: 'Login bem-sucedido'});
    });
})

app.post('/cadastro', async (req, res) => {
    const {nome, email, cpf, senha, celular, cep, logradouro, 
        bairro, cidade, estado, imagem, Tipos_Usuarios_idTipos_Usuarios} = req.body;

        cep = cep.replace(/-/g,'');
        db.query(
            'SELECT * FROM usuarios WHERE cpf = ?', [cpf], 
            async(err, results) => {
                if(err){
                    console.error('Erro ao consultar o CPF:',err)
                    return res.status(500).json({message: 'Erro ao verificar CPF'})
                }
            })

        if(results.length > 0){
            return res.status(400).json({message: 'CPF já cadastrado'});
    }
    
    const senhacripto = await bcrypt.hash(senha, 10)
     //segundo argumento é variável a ser cripto
    //segundo argumento é o custo do hash

    db.query('INSERT INTO usuarios (nome, email, cpf, senha, celular, cep, logradouro, bairro, cidade, estado,Tipos_Usuarios_idTipos_Usuarios, imagem');VALUES ('(?,?,?,?,?,?,?,?,?,?,?)');
    [nome, email, cpf, senhacripto, celular, cep, logradouro, bairro, cidade, estado, Tipos_Usuarios_idTipos_Usuarios, imagem]
    ,(err, results) => {
        if(err){
            console.error('Erro ao inserir usuário', err);
            return res.status(500).json({message: 'Erro ao cadastrar usuário'});
        }
    } 
    console.log('Usuário inserido com sucesso', results.idUsuarios);
    res.status(200).json({message:'Usuário cadastrado com sucesso! '});

});

app.use(express.static('/src'));
app.use(express.static(__dirname + '/src'));
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/src/login.html')
})


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servido rodando na porta ${PORT}`));