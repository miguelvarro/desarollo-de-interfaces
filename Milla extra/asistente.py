import subprocess
import json

def consultar_ollama(registros):
    """
    Envía un resumen de lo procesado a Ollama y pide sugerencias de nuevas acciones.
    """
    prompt = f"""
    Eres un asistente que analiza registros de imágenes procesadas.
    Aquí tienes los datos actuales:
    {json.dumps(registros, indent=2, ensure_ascii=False)}

    Indica qué acciones recomendarías realizar a continuación.
    Por ejemplo: aplicar otro filtro, eliminar duplicados o generar un informe.
    Responde con un texto corto en español.
    """

    try:
        resultado = subprocess.run(
            ["ollama", "run", "llama3.1:8b-instruct-q4_0"],
            input=prompt.encode("utf-8"),
            capture_output=True
        )

        respuesta = resultado.stdout.decode("utf-8").strip()
        return respuesta

    except Exception as e:
        return f"Error al consultar Ollama: {e}"

