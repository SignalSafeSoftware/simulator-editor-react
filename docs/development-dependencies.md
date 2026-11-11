# Development dependencies

The public simulator dependencies now use registry versions: core 0.7.2, React 0.21.2, device 0.21.4 in the example, and theme 0.13.4. Root peer ranges match the validated versions. Regenerate and commit npm lockfiles from real registry metadata; never fabricate integrity values.

The editor is released publicly as 0.1.1. The example uses that registry version; its legacy archive is removed. Public simulator packages are installed from npm. Packed smoke consumers prefer online metadata so a stale cache cannot hide newly published peer versions.
