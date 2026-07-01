import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter __dirname equivalente para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Template do componente Smart
const smartComponentTemplate = `import clsx from "clsx";
import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

interface {{pascalCase name}}Props extends ComponentProps<"div"> {
  variant: "default" | "success";
}

export function {{pascalCase name}}({ variant, ...props }: {{pascalCase name}}Props) {
  const classes = twMerge(
    clsx(
      "flex",
      variant !== "default" && "flex",
      variant === "success" && "flex"
    )
  );

  return <div className={classes} {...props}></div>;
}`;

// Template do componente Básico
const basicComponentTemplate = `export function {{pascalCase name}}() {
    return (
        <>
        <div>

        </div>
        </>
    );
}`;

// Função para converter string para PascalCase
function toPascalCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toUpperCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '');
}

// Função principal
function generateComponent(type = 'smart', componentName = null) {
  const uiDir = path.join(__dirname, '../components/ui');

  // Definir nome do componente baseado no tipo
  if (!componentName) {
    componentName = type === 'basic' ? 'BasicReactComponent' : 'SmartReactComponent';
  }

  const fileName = `${componentName}.tsx`;
  const filePath = path.join(uiDir, fileName);

  // Selecionar template baseado no tipo
  const template = type === 'basic' ? basicComponentTemplate : smartComponentTemplate;

  // Substituir placeholders no template
  let componentCode = template.replace(/{{pascalCase name}}/g, componentName);

  // Verificar se o arquivo já existe
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  O arquivo ${fileName} já existe em ${uiDir}`);
    console.log('Por favor, renomeie o arquivo existente ou escolha outro nome.');
    return;
  }

  // Criar o arquivo do componente
  fs.writeFileSync(filePath, componentCode, 'utf8');

  console.log(`✅ Componente ${type} gerado com sucesso!`);
  console.log(`📁 Local: ${filePath}`);
  console.log(`📝 Nome do arquivo: ${fileName}`);
  console.log(`\n🔄 Próximos passos:`);
  console.log(`1. Renomeie o arquivo para o nome desejado`);
  console.log(`2. Abra o arquivo e substitua "${componentName}" pelo nome do seu componente`);
  if (type === 'smart') {
    console.log(`3. Ajuste as props e estilos conforme necessário`);
  }
}

// Executar a função baseado nos argumentos de linha de comando
const args = process.argv.slice(2);
const type = args[0] || 'smart';
const componentName = args[1];

generateComponent(type, componentName);
