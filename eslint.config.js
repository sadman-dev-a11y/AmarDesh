import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config(js.configs.recommended,...ts.configs.recommended,{files:['src/**/*.{ts,tsx}'],languageOptions:{globals:{window:'readonly',document:'readonly',navigator:'readonly',localStorage:'readonly',console:'readonly',fetch:'readonly',URL:'readonly',Blob:'readonly',setTimeout:'readonly'}}});
