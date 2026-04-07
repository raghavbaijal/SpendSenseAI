import fs from 'fs';
import path from 'path';

function checkDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && file !== 'node_modules' && !file.startsWith('.')) {
            checkDirectory(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
            let match;
            
            while ((match = importRegex.exec(content)) !== null) {
                const importPath = match[1];
                if (importPath.startsWith('.')) {
                    verifyCase(fullPath, importPath);
                }
            }
        }
    }
}

function verifyCase(sourceFile, importPath) {
    try {
        const dir = path.dirname(sourceFile);
        let resolvedPath = path.resolve(dir, importPath);
        
        // Handle no extension (vite adds .ts, .tsx, .js, .jsx)
        if (!fs.existsSync(resolvedPath)) {
            if (fs.existsSync(resolvedPath + '.ts')) resolvedPath += '.ts';
            else if (fs.existsSync(resolvedPath + '.tsx')) resolvedPath += '.tsx';
            else if (fs.existsSync(resolvedPath + '.js')) resolvedPath += '.js';
            else if (fs.existsSync(resolvedPath + '.jsx')) resolvedPath += '.jsx';
            else if (fs.existsSync(resolvedPath + '/index.ts')) resolvedPath += '/index.ts';
            else if (fs.existsSync(resolvedPath + '/index.tsx')) resolvedPath += '/index.tsx';
        }

        if (!fs.existsSync(resolvedPath)) {
            return; // Could be a valid virtual module or alias
        }

        const realDir = path.dirname(resolvedPath);
        const expectedFile = path.basename(resolvedPath);
        
        const actualFiles = fs.readdirSync(realDir);
        if (!actualFiles.includes(expectedFile)) {
            console.error(`CASE MISMATCH in ${sourceFile}\n -> Imported as: '${importPath}'\n -> But actual file is one of: ${actualFiles.filter(f => f.toLowerCase() === expectedFile.toLowerCase()).join(', ')}\n`);
        }
    } catch (e) {
        // Ignore parsing errors
    }
}

console.log("Checking for case-sensitivity mismatches...");
checkDirectory(path.join(process.cwd(), 'src'));
console.log("Check complete.");
