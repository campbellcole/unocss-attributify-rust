{
  description = "A version of unocss' `presetAttributify` modified to support the `rsx!` macro";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem(system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      with pkgs;
      {
        devShells.default = pkgs.mkShell rec {
          nativeBuildInputs = [
            nodejs
            nodePackages.pnpm
          ];
        };
      }
    );
}
