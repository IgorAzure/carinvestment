import json
import math
from flask import Flask, render_template, request, jsonify
import requests
import os
import re
import unicodedata

app = Flask(__name__)

pasta_imagens = os.path.join(
    app.static_folder,
    "imagens_carros"
)

os.makedirs(pasta_imagens, exist_ok=True)

print("novo py")

@app.template_filter("moeda")
def moeda(valor):
    return f"{float(valor):,.2f}".replace(",", "X").replace(".",",").replace("X",".")

def buscar_imagem_carro(marca, modelo, ano):
    
    print("marca:", marca)
    print("modelo:", modelo)
    print("ano:", ano)
    
    nome_arquivo = criar_nome_imagem(
        marca,
        modelo,
        ano    
    )
    
    os.makedirs(
        pasta_imagens,
        exist_ok=True
    )
    
    caminho = os.path.join(
        pasta_imagens,
        nome_arquivo
    )
    
    print("PASTA IMAGENS:", pasta_imagens)
    print("NOME ARQUIVO:", nome_arquivo)
    print("CAMINHO FINAL:", caminho)
    
    if os.path.isfile(caminho):
        print("USANDO IMAGEM LOCAL:", nome_arquivo)

        return f"/static/imagens_carros/{nome_arquivo}"

    CAR_IMAGE_API_KEY = "cimg_XvmrwmzS06JbOcykRle1Ke9duDdBDFTz"

    headers = {
        "Authorization": f"Bearer {CAR_IMAGE_API_KEY}",
        "Accept": "application/json"
    }

    url_api_imagem = "https://carimage.dev/api/v1/images/car"
    url_catalogo = "https://carimage.dev/api/v1/vehicles"

    try:
        parametros = {
            "make": marca,
            "model": modelo,
            "year": ano,
            "view": "front-3-4",
            "color": "silver"
        }

        resposta = requests.get(
            url_api_imagem,
            params=parametros,
            headers=headers,
            timeout=10
        )

        print("CAR IMAGE STATUS:", resposta.status_code)

        if resposta.status_code == 200:

            dados_imagem = resposta.json()

            url_imagem = extrair_url_imagem(
                dados_imagem
            )

        elif resposta.status_code == 404:

            print("Modelo FIPE não encontrado diretamente.")
            print("Buscando modelo equivalente no catálogo...")

            resposta_catalogo = requests.get(
                url_catalogo,
                params={
                    "q": f"{marca} {modelo}"
                },
                headers=headers,
                timeout=10
            )

            if resposta_catalogo.status_code != 200:
                print(
                    "Erro catálogo:",
                    resposta_catalogo.status_code
                )
                return None

            catalogo = resposta_catalogo.json()

            resultados = (
                catalogo
                .get("data", {})
                .get("results", [])
            )

            if not resultados:
                print("Nenhum modelo encontrado no catálogo.")
                return None
            
            resultado_escolhido = None

            for resultado in resultados:

                anos = resultado.get("years", [])

                if int(ano) in anos:
                    resultado_escolhido = resultado
                    break

            if resultado_escolhido is None:
                print(
                    f"Nenhum resultado encontrado para {ano}"
                )
                return None

            marca_catalogo = resultado_escolhido["make_name"]
            modelo_catalogo = resultado_escolhido["model_name"]

            print(
                "Modelo encontrado:",
                marca_catalogo,
                modelo_catalogo,
                ano
            )
            
            parametros_corrigidos = {
                "make": marca_catalogo,
                "model": modelo_catalogo,
                "year": ano,
                "view": "front-3-4",
                "color": "silver"
            }

            resposta_imagem = requests.get(
                url_api_imagem,
                params=parametros_corrigidos,
                headers=headers,
                timeout=10
            )

            print(
                "IMAGEM CORRIGIDA STATUS:",
                resposta_imagem.status_code
            )

            if resposta_imagem.status_code != 200:
                return None

            dados_imagem = resposta_imagem.json()

            url_imagem = extrair_url_imagem(
                dados_imagem
            )

        else:

            print(
                "Erro CarImage:",
                resposta.status_code,
                resposta.text
            )

            return None
        
        if not url_imagem:
            print("URL da imagem não encontrada.")
            return None
        
        download = requests.get(
            url_imagem,
            timeout=30
        )
        
        print("STATUS DOWNLOAD:", download.status_code)
        print("CONTENT-TYPE:", download.headers.get("Content-Type"))
        print("TAMANHO:", len(download.content))

        if download.status_code != 200:
            print("donwload falhou")
            return url_imagem
        
        print("vou salvar em:", caminho)
        
        with open(caminho, "wb") as arquivo:
            arquivo.write(download.content)
            
        print("arquivo salvo?", os.path.isfile(caminho))
        print("imagem salva em:", caminho)
        
        return f"/static/imagens_carros/{nome_arquivo}"

    except Exception as erro:

        print(
            "ERRO CAR IMAGE:",
            repr(erro)
        )

        return None
    
def extrair_url_imagem(dados):
    print("Tentando extrair imagem:", dados)

    # formato:
    # {"data": {"url": "..."}}
    if isinstance(dados.get("data"), dict):

        if dados["data"].get("url"):
            return dados["data"]["url"]

        if dados["data"].get("image_url"):
            return dados["data"]["image_url"]

    # formato:
    # {"url": "..."}
    if dados.get("url"):
        return dados["url"]

    # formato:
    # {"image_url": "..."}
    if dados.get("image_url"):
        return dados["image_url"]

    print("URL da imagem não encontrada no JSON.")

    return None

def criar_nome_imagem(marca, modelo, ano):
    
    nome = f"{marca}-{modelo}-{ano}"
    
    nome = unicodedata.normalize("NFKD", nome)
    nome = nome.encode("ascii", "ignore").decode("ascii") 
    nome = nome.lower()
    nome = re.sub(r"[^a-z0-9]+", "-", nome)
    
    return nome.strip("-") + ".png"

@app.route('/')
def home():
    return render_template("home.html")

@app.route('/resultado', methods=['POST'])
def resultado():
    
    dadosCarro = json.loads(request.form["dadosCarro"])
    
    imagem = buscar_imagem_carro(
        dadosCarro["brand"],
        dadosCarro["model"],
        dadosCarro["modelYear"]
    )
    
    print("imagem retornada", imagem)

    dadosCarro["imagem"] = imagem

    # dados recebidos
    preco = float(dadosCarro['price']
                  .replace("R$", "")
                  .replace(".", "")
                  .replace(",", "."))
    
    entrada = float(dadosCarro.get("entrada") or 0)
    juros = float(dadosCarro.get("juros") or 0)
    meses = int(dadosCarro["meses"])
    
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
    
    valor_total = sum(item["parcela"] for item in tabela)
    
    
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

# @app.route('/api/calcular', methods=['POST'])
# def calcular():
#     # data = request.json
    
#     # preco = float(data['preco'])
#     # entrada = float(data.get('entrada', 0) or 0)
#     # taxa = float(data['taxa']) / 100
#     # meses = int(data['meses'])
    
#     # taxa_mensal = taxa / 12 if data['tipo_taxa'] == 'anual' else taxa
    
#     # principal = preco - entrada
    
#     # if taxa_mensal == 0:
#     #     pagamento = principal / meses
#     # else:
#     #     pagamento = principal * (taxa_mensal * (1 + taxa_mensal)**meses) / ((1 + taxa_mensal)**meses - 1)
        
#     # resposta = {'pagamento_mensal': round(pagamento, 2)}
    
#     # # if Warning:
#     # #     resposta['aviso'] = Warning
        
#     # return jsonify(resposta)


if __name__ == "__main__":
    app.run(debug=True)