{
  inputs.nixpkgs.url = "nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      supportedSystems =
        [ "x86_64-linux" "x86_64-darwin" "i686-linux" "aarch64-linux" ];
      forAllSystems = f:
        nixpkgs.lib.genAttrs supportedSystems (system: f system);

    in {
      overlays.default = final: prev: {
        node-Tor = final.callPackage ./default.nix { };
      };

      defaultPackage = forAllSystems (system:
        (import nixpkgs {
          inherit system;
          overlays = [ self.overlays.default ];
        }).node-Tor);
    };
}
