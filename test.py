import json
from flask import Flask, render_template, request, jsonify
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

FIPE_API_KEY = os.getenv("FIPE_API_KEY")

FIPE_BASE_URL = "https://fipe.api.br/api/v2/cars"

def consultar_fipe(caminho):
    try:
        resposta = requests.get(
            f"{FIPE_BASE_URL}/{caminho}",
            headers={
                "Authorization": f"Bearer {FIPE_API_KEY}",
                "Accept": "application/json"
            },
            timeout=15
        )

        return (
            jsonify(resposta.json()),
            resposta.status_code
        )

    except requests.RequestException:
        return jsonify({
            "erro": "Não foi possível consultar a FIPE."
        }), 502


@app.route("/api/fipe/brands")
def api_fipe_marcas():
    return consultar_fipe("brands")


@app.route("/api/fipe/brands/<marca>/models")
def api_fipe_modelos(marca):
    return consultar_fipe(
        f"brands/{marca}/models"
    )


@app.route("/api/fipe/brands/<marca>/models/<modelo>/years")
def api_fipe_anos(marca, modelo):
    return consultar_fipe(
        f"brands/{marca}/models/{modelo}/years"
    )


@app.route("/api/fipe/brands/<marca>/models/<modelo>/years/<ano>")
def api_fipe_carro(marca, modelo, ano):
    return consultar_fipe(
        f"brands/{marca}/models/{modelo}/years/{ano}"
    )

@app.template_filter("moeda")
def moeda(valor):
    return f"{float(valor):,.2f}".replace(",", "X").replace(".",",").replace("X",".")

@app.route('/')
def home():
    return render_template("home.html")

@app.route('/resultado', methods=['POST'])
def resultado():
    dadosCarro = json.loads(request.form["dadosCarro"])
    
    marca_id = dadosCarro["marcaId"]
    modelo_id = dadosCarro["modeloId"]
    ano_id = dadosCarro["anoId"]
    
    url = (
        f"{FIPE_BASE_URL}/brands/{marca_id}"
        f"/models/{modelo_id}"
        f"/years/{ano_id}"
    )
    
    resposta_fipe = requests.get(
        url,
        headers={
            "Authorization": f"Bearer {FIPE_API_KEY}",
            "Accept": "application/json"
        }
    )
    
    if not resposta_fipe.ok:
        return "Erro ao consultar tabela Fipe", 502
    
    carro_fipe = resposta_fipe.json()
    
    dadosCarro["brand"] = carro_fipe["brand"]
    dadosCarro["model"] = carro_fipe["model"]
    dadosCarro["modelYear"] = carro_fipe["modelYear"]
    dadosCarro["price"] = carro_fipe["price"]

    # dados recebidos
    preco = float(
        carro_fipe['price']
                  .replace("R$", "")
                  .replace(".", "")
                  .replace(",", "."))
    
    entrada = float(dadosCarro.get("entrada") or 0)
    juros = float(dadosCarro.get("juros") or 0)
    meses = int(dadosCarro["meses"])
    
    if juros < 1:
        return "Taxa de juros invalida", 400
    
    if entrada < 0:
        return "Valor de entrada invalido", 400
    
    if entrada >= preco:
        return "A entrada nao pode ser maior do que o valor do veiculo", 400
    
    MESES_PERMITIDOS = {
        12, 24, 36, 48
    }
    
    if meses not in MESES_PERMITIDOS:
        return "Quantidade de meses invalida", 400
    
    saldo = preco - entrada
    
    taxa_mensal = juros / 100
    
    if taxa_mensal == 0:
        parcela = saldo / meses
    else:
        parcela = saldo * (
            taxa_mensal * (1 + taxa_mensal) ** meses
        ) / (
            (1 + taxa_mensal) ** meses - 1
        )
        
    tabela = []
    
    saldo_atual = saldo
    total_juros = 0
    total_amortizacao = 0
    
    for mes in range(1, meses + 1):
         # juros sobre o saldo devedor
        juros_mes = saldo_atual * taxa_mensal
         
        amortizacao = parcela - juros_mes
         
        if mes == meses:
             amortizacao = saldo_atual
             parcela_mes = amortizacao + juros_mes
             novo_saldo = 0
        else:
            parcela_mes = parcela
            novo_saldo = saldo_atual - amortizacao
            
        total_juros += juros_mes
        total_amortizacao += amortizacao
        
        tabela.append({
            "mes": mes,
            "parcela": round(parcela_mes, 2),
            "juros": round(juros_mes, 2),
            "amortizacao": round(amortizacao, 2),
            "saldo": round(novo_saldo, 2)
        })
        
        saldo_atual = novo_saldo
    
    total_parcelas = sum(item["parcela"] for item in tabela)
    
    valor_total = entrada + total_parcelas
    
    return render_template(
        "resultado.html", 
        dadosCarro=dadosCarro, 
        tabela=tabela,
        entrada=round(entrada, 2),
        parcela=round(parcela, 2),
        juros=juros,
        total_juros=round(total_juros, 2),
        total_amortizacao=round(total_amortizacao, 2),
        valor_total=round(valor_total, 2),
        saldo=round(saldo, 2),
    )

if __name__ == "__main__":
    app.run(debug=False)