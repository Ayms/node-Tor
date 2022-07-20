{ mkDerivation
, fetchFromGitHub
}:

mkDerivation rec {
  pname = "node-Tor";
  version = "7429c58008e974ff71909251f713fb1a01f74976";

  src = fetchFromGitHub {
    owner = "Ayms";
    repo = pname;
    commit = version;
    sha256 = "";
  };

  buildPhase = ''
    mkdir $out
    touch $out/hello
  '';

  dontInstall = true;
}
