import json
import math
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/resultado', methods=['POST'])
def resultado():
    
    dadosCarro = json.loads(request.form["dadosCarro"])
    
    print(dadosCarro)
    
    return render_template("resultado.html", dadosCarro=dadosCarro)

@app.route('/')
def home():
    return render_template("home.html")

@app.route('/api/calcular', methods=['POST'])
def calcular():
    data = request.json
    
    preco = float(data['preco'])
    entrada = float(data.get('entrada', 0) or 0)
    taxa = float(data['taxa']) / 100
    meses = int(data['meses'])
    
    taxa_mensal = taxa / 12 if data['tipo_taxa'] == 'anual' else taxa
    
    principal = preco - entrada
    
    if taxa_mensal == 0:
        pagamento = principal / meses
    else:
        pagamento = principal * (taxa_mensal * (1 + taxa_mensal)**meses) / ((1 + taxa_mensal)**meses - 1)
        
    resposta = {'pagamento_mensal': round(pagamento, 2)}
    
    # if Warning:
    #     resposta['aviso'] = Warning
        
    return jsonify(resposta)


if __name__ == "__main__":
    app.run(debug=True)