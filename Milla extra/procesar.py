import os
import json
from PIL import Image, ImageFilter


def procesar_imagen(img, output_dir):
    import os
    from PIL import Image

    try:
        nombre = os.path.basename(img)
        salida = os.path.join(output_dir, nombre)

        imagen = Image.open(img)
        # Aquí puedes aplicar el filtro o cualquier modificación
        imagen = imagen.convert("L")  # ejemplo: convertir a blanco y negro
        imagen.save(salida)

        return {"imagen": nombre, "estado": "Procesada correctamente"}

    except Exception as e:
        return {"imagen": img, "error": str(e)}


def guardar_registros(registros, archivo_json):
    with open(archivo_json, "w") as f:
        json.dump([r for r in registros if r], f, indent=4, ensure_ascii=False)

def obtener_imagenes(input_dir, extensiones=(".jpg", ".png")):
    return [f for f in os.listdir(input_dir) if f.lower().endswith(extensiones)]
