const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PACKAGES = [
    '@simen-keyboard-listener/darwin-arm64'
];

const NODE_MODULES = path.join(__dirname, '..', 'node_modules');

console.log('🔄 Checking macOS optional dependencies for cross-platform build...');

PACKAGES.forEach(pkg => {
    try {
        // Construct target path: node_modules/@context/pkg
        // pkg is like @scope/name
        const pkgParts = pkg.split('/');
        const scope = pkgParts[0];
        const name = pkgParts[1];
        const targetDir = path.join(NODE_MODULES, scope, name);

        console.log(`\n📦 Processing ${pkg}...`);

        // Check if already exists and looks valid (has package.json)
        if (fs.existsSync(path.join(targetDir, 'package.json'))) {
            console.log(`   ✅ ${pkg} is already installed.`);
            return;
        }

        console.log(`   🔸 Missing. Force installing...`);

        // Create directory if it doesn't exist
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // 1. Download .tgz (npm pack) in a temp directory or cwd
        console.log('   ⬇️  Downloading pack...');
        const packOutput = execSync(`npm pack ${pkg}`, { encoding: 'utf8' }).trim();
        const tgzName = packOutput.split('\n').pop().trim();

        if (!fs.existsSync(tgzName)) {
            throw new Error(`Failed to find packed file: ${tgzName}`);
        }

        // 2. Extract
        console.log('   📂 Extracting...');
        // tar -xf works on Windows 10/11 PowerShell/CMD
        execSync(`tar -xf ${tgzName}`);

        // 3. Move contents from 'package' folder to targetDir
        const extractedPackageDir = path.join(process.cwd(), 'package');

        console.log(`   🚚 Moving to ${targetDir}...`);

        // Copy recursive
        cpSync(extractedPackageDir, targetDir);

        // 4. Cleanup
        console.log('   🧹 Cleaning up...');
        try {
            fs.unlinkSync(tgzName);
            fs.rmSync(extractedPackageDir, { recursive: true, force: true });
        } catch (cleanupErr) {
            console.warn('   ⚠️  Cleanup warning:', cleanupErr.message);
        }

        console.log(`   ✅ Successfully installed ${pkg}`);

    } catch (error) {
        console.error(`   ❌ Failed to install ${pkg}:`, error.message);
        // Don't exit process, try other packages if any (though here we only have one)
    }
});

function cpSync(source, destination) {
    // Node 16.7.0+ has fs.cpSync
    if (fs.cpSync) {
        fs.cpSync(source, destination, { recursive: true, force: true });
        return;
    }

    // Fallback for older Node versions
    if (fs.lstatSync(source).isDirectory()) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
        }
        fs.readdirSync(source).forEach(childItemName => {
            cpSync(path.join(source, childItemName), path.join(destination, childItemName));
        });
    } else {
        fs.copyFileSync(source, destination);
    }
}
