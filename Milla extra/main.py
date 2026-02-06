import os
import json
import multiprocessing
from multiprocessing import Pool, cpu_count
from procesar import obtener_imagenes, procesar_imagen, guardar_registros
from asistente import consultar_ollama

INPUT_DIR = "imagenes"
OUTPUT_DIR = "imagenes_editadas"
REGISTRO_FILE = "registros.json"

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    imagenes = obtener_imagenes(INPUT_DIR)
    print(f"📸 Imágenes detectadas: {len(imagenes)}")

    if imagenes:
        with Pool(cpu_count()) as pool:
            resultados = pool.starmap(procesar_imagen, [(img, OUTPUT_DIR) for img in imagenes])

        guardar_registros(resultados, REGISTRO_FILE)
        print("✅ Procesamiento completado y registros guardados.")

        with open(REGISTRO_FILE, "r") as f:
            registros = json.load(f)

        print("\n🤖 Consultando a Ollama...")
        respuesta = consultar_ollama(registros)
        print(f"\n💬 Respuesta de Ollama:\n{respuesta}")
    else:
        print("⚠️ No se encontraron imágenes para procesar.")


if __name__ == "__main__":
    multiprocessing.freeze_support()  
    main()

