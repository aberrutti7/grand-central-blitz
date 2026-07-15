import os

def process_json_files(directory):
    # Obtener todos los archivos JSON en el directorio
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            file_path = os.path.join(directory, filename)

            # Leer el contenido del archivo
            with open(file_path, 'r') as plays_file:
                lines = plays_file.readlines()
            
            aux = ''
            for line in lines:
                line = line.strip()
                line = line.replace(' ', '')
                line = line.rstrip('\n')
                aux += line
            
            aux = aux.replace('[{\"basespin\":', '\n\t[{\"basespin\":')
            # aux = aux.replace('[{\"freespin\":', '\n\t[{\"freespin\":')
            aux = aux.replace('{\"spins\":[','{\n\"spins\":\n[')
            aux = aux.replace('}]]}', '}]\n]\n}')

            # Escribir el contenido transformado de nuevo en el archivo
            with open(file_path, 'w') as plays_file:
                plays_file.write(aux)
            print(f'Archivo procesado: {filename}')

# Especifica el directorio raíz
root_path = '.'
process_json_files(root_path)
