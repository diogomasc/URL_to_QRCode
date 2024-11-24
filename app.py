from flask import Flask, render_template, request, jsonify
import qrcode
from io import BytesIO
import base64
from PIL import Image
import os
from urllib.parse import urlparse

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_qrcode():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados JSON não fornecidos'
            }), 400

        url = data.get('url')
        if not url:
            return jsonify({
                'success': False,
                'error': 'URL não fornecida'
            }), 400

        # Validar URL
        try:
            result = urlparse(url)
            if not all([result.scheme, result.netloc]):
                return jsonify({
                    'success': False,
                    'error': 'URL inválida. Certifique-se de incluir http:// ou https://'
                }), 400
        except Exception:
            return jsonify({
                'success': False,
                'error': 'URL inválida'
            }), 400

        # Criar QR Code
        qr = qrcode.QRCode(
            version=None,  
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=8, 
            border=3,  
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Criar imagem QR code
        qr_image = qr.make_image(fill_color="black", back_color="white").convert('RGBA')
        
        # Redimensionar para 350x350
        qr_image = qr_image.resize((350, 350), Image.Resampling.LANCZOS)

        try:
            # Carregar e redimensionar o logo
            logo_path = os.path.join('static', 'img', 'logo.png')
            if os.path.exists(logo_path):
                logo = Image.open(logo_path)

                # Calcular o tamanho do logo (20% de 350)
                logo_size = int(350 * 0.20)
                logo = logo.resize((logo_size, logo_size))

                # Calcular posição para centralizar o logo
                pos = ((350 - logo_size) // 2,
                      (350 - logo_size) // 2)

                # Combinar QR code com logo
                qr_image.paste(logo, pos, logo)
        except Exception as e:
            # Se houver erro ao adicionar o logo, continua sem ele
            print(f"Erro ao adicionar logo: {str(e)}")

        # Gerar nome do arquivo baseado na URL
        parsed_url = urlparse(url)
        filename = f"qrcode_{parsed_url.netloc}{parsed_url.path}".replace('/', '_')[:100] + '.png'

        # Converter para base64
        buffered = BytesIO()
        qr_image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return jsonify({
            'success': True,
            'image': img_str,
            'filename': filename
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor: ' + str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
