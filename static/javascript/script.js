const FIPE_BASE_URL = "/api/fipe";

let dadosCarroGlobal;

// async function enviarDados(dadosCarro) {
//     try {
//         const resposta = await fetch("http://127.0.0.1:5000/resultado", {
//             method: "POST",

//             headers: {"Content-Type": "application/json"},

//             body: JSON.stringify(dadosCarro)
//         });
           
//         const dadosResposta = await resposta.text()

//         document.documentElement.innerHTML = dadosResposta

//     } catch(error) {
//         console.error("Erro ao enviar os dados", error);
//     }
// }

async function abrirModalMeses() {

    const jurosInput = document.getElementById("valorJuros")
    const entradaInput = document.getElementById("valorEntrada")

    const erroJuros = document.getElementById("erroJuros");
    const erroEntrada = document.getElementById("erroEntrada");

    const juros = Number(jurosInput.value);
    const entrada = Number(entradaInput.value || 0);

    jurosInput.classList.remove("input-erro");
    entradaInput.classList.remove("input-erro");

    erroJuros.classList.remove("ativo");
    erroEntrada.classList.remove("ativo");

    erroJuros.textContent = "";
    erroEntrada.textContent = "";

    if (jurosInput.value === "" || !Number.isFinite(juros) || juros < 1) {
        jurosInput.classList.add("input-erro");
        erroJuros.textContent = "Informe uma taxa de juros de no minimo 1% ao mes";
        erroJuros.classList.add("ativo")
        return;
    }

    if (!Number.isFinite(entrada) || entrada < 0) {
        entradaInput.classList.add("input-erro");
        erroEntrada.textContent = "O valor de entrada nao pode ser negativo"
        erroEntrada.classList.add("ativo");
        return;
    }

    const carro = await testePreco();

    if (!carro) {
        console.log("CARRO NÃO RETORNOU");
        return;
    };

    const precoCarro = Number(
        carro.price
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim()
    );

    if (!Number.isFinite(precoCarro)) {
        console.error("ERRO AO CONVERTER PREÇO:", carro.price);
        return;
    }

    if (entrada >= precoCarro) {
        entradaInput.classList.add("input-erro");
        erroEntrada.textContent = `A entrada deve ser menor que ${carro.price}`;
        erroEntrada.classList.add("ativo");
        return
    }

    carro.juros = juros;
    carro.entrada = entrada;

    dadosCarroGlobal = carro;

    document.getElementById("modalMeses").style.display = "flex";
}


function fecharModalMeses() {

    document.getElementById('modalMeses').style.display = 'none'; 
}

function cancelarModalMeses() { 
    document.getElementById('modalMeses').style.display = 'none'; 
}

function calcularFinanciamentoFinal() {

    const meses = Number(
        document.getElementById("quantidadeMeses").value
    );

    dadosCarroGlobal.meses = meses;

    document.getElementById("dadosCarro").value =
        JSON.stringify(dadosCarroGlobal);

    document.getElementById("formResultado").submit();
}

async function testePreco() {

    const nomeMarcaDigitada =
        document.getElementById('marcaInput').value;
    
    const nomeModeloDigitado =
        document.getElementById('nomeCarro').value;

    if (!nomeMarcaDigitada || !nomeModeloDigitado) {
        console.error("Preencha a marca e o modelo primeiro!");
        return;
    }

    const marcaEncontrada = marcasGlobais.find(
        m => m.name.toLowerCase() === 
        nomeMarcaDigitada.toLowerCase()
    );

    const modeloEncontrado = modelosGlobais.find(
        m => m.name.toLowerCase() === 
        nomeModeloDigitado.toLowerCase()
    );

    if (!marcaEncontrada || !modeloEncontrado) {
        console.error("Marca ou Modelo não encontrados nas listas da API.");
        return;
    }

    const marcaId = marcaEncontrada.code; 
    const modeloId = modeloEncontrado.code; 

    try {

        const resAnos = await fetch(
            `${FIPE_BASE_URL}/brands/${marcaId}/models/${modeloId}/years`
        );

        if (!resAnos.ok) {
            console.error("Erro ao consultar os anos.");
            return null;
        }

        const anos = await resAnos.json();

        if (!Array.isArray(anos)) {
            console.error("Resposta inesperada da API:", anos);
            return null;
        }

        
        // Pega o código do primeiro ano da lista (geralmente o mais recente ou Zero Km)
        const anosReais = anos.filter(ano => {
            const numeroAno = parseInt(ano.code.split("-")[0]);

            return numeroAno !== 32000;
        });

        if (!anosReais.length === 0) {
            console.error("Nenhum ano válido encontrado.");
            return null;
        }

        const anoMaisRecente = anosReais.reduce((maisRecente, atual) => {
            const anoAtual = parseInt(atual.code.split("-")[0]);
            const anoAnterior = parseInt(maisRecente.code.split("-")[0]);

            return anoAtual > anoAnterior ? atual : maisRecente;
        });
        
        const anoId = anoMaisRecente.code;

        //Vai direto no endpoint final com os 3 IDs corretos
        const resposta = await fetch(
            `${FIPE_BASE_URL}/brands/${marcaId}/models/${modeloId}/years/${anoId}`
        );

        if (!resposta.ok) {
            console.error("Erro na requisição. Verifique sua chave de API.");
            return;
        }

        const dadosCarro = await resposta.json();

        dadosCarro.marcaId = marcaId;
        dadosCarro.modeloId = modeloId;
        dadosCarro.anoId = anoId;

        return dadosCarro;

    } catch (erro) {
        console.error("Erro de conexão:", erro);
    }
}

let marcasGlobais = [];
let modelosGlobais = [];


async function buscarMarcas() {
    try {
        const resposta = await fetch(`${FIPE_BASE_URL}/brands`);
        marcasGlobais = await resposta.json();
        
        const datalistMarcas = document.getElementById('listaMarcas');
        datalistMarcas.innerHTML = "";

        marcasGlobais.forEach(marca => {
            datalistMarcas.innerHTML += `<option value="${marca.name}"></option>`;
        });

        return marcasGlobais;

    } catch (erro) {
        console.error("Erro ao carregar marcas:", erro);
        return [];
    }
}


async function carregarModelosDaMarca() {
    const nomeMarcaDigitada = document.getElementById('marcaInput').value;
    const inputModelo = document.getElementById('nomeCarro');
    const datalistModelos = document.getElementById('listaModelos');

    const marcaEncontrada = marcasGlobais.find(m => m.name.toLowerCase() === nomeMarcaDigitada.toLowerCase());

    if (!marcaEncontrada) {
        inputModelo.disabled = true;
        inputModelo.placeholder = "Marca não encontrada. Tente novamente.";
        inputModelo.value = "";
        return;
    }

    inputModelo.disabled = true;
    inputModelo.placeholder = "Buscando modelos...";
    inputModelo.value = "";

    try {
        const resposta = await fetch(`${FIPE_BASE_URL}/brands/${marcaEncontrada.code}/models`);
        
        modelosGlobais = await resposta.json();
        
        datalistModelos.innerHTML = "";
        modelosGlobais.forEach(modelo => {
            datalistModelos.innerHTML += `<option value="${modelo.name}"></option>`;
        });

        inputModelo.disabled = false;
        inputModelo.placeholder = "Comece a digitar o modelo...";
        inputModelo.focus();

    } catch (erro) {
        console.error("Erro ao buscar modelos:", erro);
        inputModelo.placeholder = "Erro ao buscar modelos.";
    }
}

async function carregarStatusFipe() {
    const referenciaEl = document.getElementById("referenciaFipe")
    const consultaEl = document.getElementById("ultimaConsulta")

    if (!referenciaEl || !consultaEl) {
        return;
    }

    try {
        const marca = marcasGlobais[0];

        const respostaModelos = await fetch(
            `${FIPE_BASE_URL}/brands/${marca.code}/models`);

        if (!respostaModelos.ok) {
            throw new Error("Erro ao consultar modelos");
        }

        const modelos = await respostaModelos.json();
        const modelo = modelos[0];

    const respostaAnos = await fetch(
        `${FIPE_BASE_URL}/brands/${marca.code}/models/${modelo.code}/years`);

    if (!respostaAnos.ok) {
        throw new Error("Erro ao consultar anos");
    }

    const anos = await respostaAnos.json();

    const anosReais = anos.filter(ano => {
        const numeroAno = parseInt(ano.code.split("-")[0]);
        return numeroAno !== 32000;
    });

    if (!anosReais.length) {
        throw new Error("Nenhum ano encontrado");
    }

    const ano = anosReais[0];

    const respostaCarro = await fetch(
        `${FIPE_BASE_URL}/brands/${marca.code}/models/${modelo.code}/years/${ano.code}`);

    if (!respostaCarro.ok) {
        throw new Error("Erro ao consultar referencia FIPE");
    }

    const dadosCarro = await respostaCarro.json();

    referenciaEl.textContent =
        dadosCarro.referenceMonth || "INDISPONIVEL";

    consultaEl.textContent =
        new Date().toLocaleDateString("pt-BR");

    } catch (erro) {
        console.error("Erro ao consultar status da Fipe:", erro);

        referenciaEl.textContent = "INDISPONIVEL";
        consultaEl.textContent = "INDISPONIVEL"
    }
    
}

async function iniciarHome() {
    await buscarMarcas();
    await carregarStatusFipe();
}

iniciarHome();

