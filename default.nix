{ stdenv
, fetchFromGitHub
, nodePackages
}:

stdenv.mkDerivation rec {
  pname = "node-Tor";
  version = "7429c58008e974ff71909251f713fb1a01f74976";

  src = fetchFromGitHub {
    owner = "Ayms";
    repo = pname;
    rev = version;
    sha256 = "sha256-Rplpc+sgKzG00xaNkdhOwwvzqe3KfKV3XJTDBglfkHM=";
  };

  buildInputs = [
    nodePackages.browserify
    nodePackages.terser
  ];

  buildPhase = ''
    cd lib
    browserify node-tor.js > ../html/browser.js
    cd ../html
    terser browser.js -c -m -o minified.js
    cd ..
  '';
  installPhase = ''
    # lib/node
    mkdir -p $out/lib/node
    cp -r lib/* $out/lib/node
    mv $out/lib/node/node-tor.js $out/lib/node/node-Tor.js
    cat > $out/lib/node/package.json << EOF
    {
      "name": "${pname}",
      "version": "0.0.0-${version}",
      "license": "MIT",
      "main": "node-Tor.js"
    }
    EOF

    # lib/browser
    mkdir -p $out/lib/browser
    cp html/browser.js $out/lib/browser/node-Tor.js
    cp html/minified.js $out/lib/browser/node-Tor.min.js
  '';
}
