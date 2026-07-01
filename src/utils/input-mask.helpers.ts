export function applyMask(value: string, mask?: string): string {
    if (!mask) return value;
    const digits = value.replace(/\D/g, "");
    switch (mask) {
        case "cpf":
            return digits
                .replace(/^(\d{3})(\d)/, "$1.$2")
                .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/\.(\d{3})(\d)/, ".$1-$2")
                .substring(0, 14);
        case "cnpj":
            return digits
                .replace(/^(\d{2})(\d)/, "$1.$2")
                .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/\.(\d{3})(\d)/, ".$1/$2")
                .replace(/(\d{4})(\d)/, "$1-$2")
                .substring(0, 18);
        case "phone":
            // Limita telefone/celular brasileiro a 11 dígitos (DDD + 9 dígitos).
            // Evita overflow de máscara ao digitar números além do permitido.
            const phoneDigits = digits.substring(0, 11);
            if (phoneDigits.length <= 10) {
                return phoneDigits
                    .replace(/^(\d{2})(\d)/g, "($1) $2")
                    .replace(/(\d{4})(\d{1,4})$/, "$1-$2")
                    .substring(0, 14);
            }
            return phoneDigits
                .replace(/^(\d{2})(\d)/g, "($1) $2")
                .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
                .substring(0, 15);
        case "cep":
            return digits.replace(/^(\d{5})(\d)/, "$1-$2").substring(0, 9);
        case "cepOrCity":
            // Location field accepts a city name OR a CEP. Only apply the
            // CEP mask (00000-000) when the value looks purely numeric;
            // otherwise leave free text (city names) untouched.
            if (/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(value)) return value;
            return digits.replace(/^(\d{5})(\d)/, "$1-$2").substring(0, 9);
        case "date":
            return digits
                .replace(/^(\d{2})(\d)/, "$1/$2")
                .replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3")
                .substring(0, 10);
        case "rg":
            return digits
                .replace(/^(\d{2})(\d)/, "$1.$2")
                .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/\.(\d{3})(\d)/, ".$1-$2")
                .substring(0, 12);
        case "cns":
            return digits
                .replace(/^(\d{3})(\d)/, "$1.$2")
                .replace(/^(\d{3})\.(\d{4})(\d)/, "$1.$2.$3")
                .replace(/^(\d{3})\.(\d{4})\.(\d{4})(\d)/, "$1.$2.$3.$4")
                .substring(0, 18);
        case "orgaoEmissor":
            const letters = value
                .toUpperCase()
                .replace(/[^A-Z]/g, "")
                .substring(0, 5);

            if (letters.length <= 3) {
                return letters;
            }

            return `${letters.slice(0, 3)}/${letters.slice(3, 5)}`;
        case "matricula":
            return digits.replace(/(\d{4})(?=\d)/g, "$1 ").substring(0, 9);
        case "cro":
            const croDigits = value.replace(/\D/g, '');
            return croDigits.substring(0, 6);
        case "cartao":
            return digits
                .replace(/^(\d{3})(\d)/, "$1.$2")
                .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/^(\d{3})\.(\d{3})\.(\d{6})(\d)/, "$1.$2.$3.$4")
                .replace(/^(\d{3})\.(\d{3})\.(\d{6})\.(\d{5})(\d)/, "$1.$2.$3.$4.$5")
                .substring(0, 24);
        case "loginBeneficiario":
            if (digits.length <= 11) {
                // CPF: 000.000.000-00
                return digits
                    .replace(/^(\d{3})(\d)/, "$1.$2")
                    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
                    .replace(/\.(\d{3})(\d)/, ".$1-$2")
                    .substring(0, 14);
            }
            // Cartão: 000.000.000000.00000.000 — grupos 3.3.6.5.3
            return digits
                .replace(/^(\d{3})(\d)/, "$1.$2")
                .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/^(\d{3})\.(\d{3})\.(\d{6})(\d)/, "$1.$2.$3.$4")
                .replace(/^(\d{3})\.(\d{3})\.(\d{6})\.(\d{5})(\d)/, "$1.$2.$3.$4.$5")
                .substring(0, 24);
        default:
            return value;    }
}
