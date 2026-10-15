// Appdesk: pure, testable configuration and command generation.
export const WORKFLOW_URL = "https://github.com/Base27-CVNSS/Appdesk/actions/workflows/pake-cli.yaml";
const platforms = ["windows-latest","macos-latest","ubuntu-24.04"];
const linuxTargets = ["deb","appimage","rpm","zst","deb,appimage"];
const trim = (v) => String(v ?? "").trim();

export function parseSettings(raw) {
  const inputUrl = trim(raw.url);
  if (!inputUrl || inputUrl.length > 2000) throw Error("Vui lòng nhập URL website hợp lệ (tối đa 2.000 ký tự).");
  let url;
  try { url = new URL(inputUrl); } catch { throw Error("URL không hợp lệ. Ví dụ: https://example.com"); }
  if (!["http:","https:"].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw Error("Chỉ hỗ trợ HTTP/HTTPS, không có tên đăng nhập hoặc mật khẩu trong URL.");
  }
  const name = trim(raw.name);
  if (!/^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,63}$/u.test(name)) {
    throw Error("Tên ứng dụng dài 1–64 ký tự, chỉ dùng chữ, số, dấu cách, dấu chấm và gạch ngang/dưới.");
  }
  const version = trim(raw.version) || "1.0.0";
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw Error("Phiên bản phải có dạng 1.0.0.");
  const platform = trim(raw.platform);
  if (!platforms.includes(platform)) throw Error("Hệ điều hành không hợp lệ.");
  const width = Number(raw.width), height = Number(raw.height);
  if (!Number.isInteger(width) || width < 640 || width > 3840 ||
      !Number.isInteger(height) || height < 480 || height > 2160) {
    throw Error("Chiều rộng 640–3840 px và chiều cao 480–2160 px.");
  }
  const icon = trim(raw.icon);
  if (icon) {
    let i;
    try { i = new URL(icon); } catch { throw Error("URL biểu tượng không hợp lệ."); }
    if (!["https:","http:"].includes(i.protocol) || !i.hostname || i.username || i.password) {
      throw Error("URL biểu tượng phải là HTTP/HTTPS và không chứa thông tin đăng nhập.");
    }
  }
  const targets = trim(raw.targets) || "deb";
  if (!linuxTargets.includes(targets)) throw Error("Định dạng Linux không hợp lệ.");
  return {
    url:url.href,name,version,platform,width,height,icon,targets,
    newWindow:Boolean(raw.newWindow), fullscreen:Boolean(raw.fullscreen),
    hideTitle:platform==="macos-latest" && Boolean(raw.hideTitle),
    multiArch:platform==="macos-latest" && Boolean(raw.multiArch)
  };
}

export function actionInputs(c) {
  return {
    platform:c.platform,url:c.url,name:c.name,icon:c.icon,
    width:String(c.width),height:String(c.height),app_version:c.version,
    fullscreen:String(c.fullscreen),hide_title_bar:String(c.hideTitle),
    new_window:String(c.newWindow),multi_arch:String(c.multiArch),
    targets:c.platform==="ubuntu-24.04" ? c.targets : "deb"
  };
}

const quoteBash = (s) => "'" + String(s).replace(/'/g, "'\\''") + "'";
const quotePS = (s) => "'" + String(s).replace(/'/g, "''") + "'";
export function commandArgs(c) {
  const args = [c.url,"--name",c.name,"--width",String(c.width),"--height",String(c.height),"--app-version",c.version];
  if(c.icon) args.push("--icon",c.icon);
  if(c.newWindow) args.push("--new-window");
  if(c.fullscreen) args.push("--fullscreen");
  if(c.hideTitle) args.push("--hide-title-bar");
  if(c.multiArch) args.push("--multi-arch");
  if(c.platform==="ubuntu-24.04") args.push("--targets",c.targets);
  return args;
}
export function cliCommand(c) {
  const quote=c.platform==="windows-latest" ? quotePS : quoteBash;
  return "npx --yes pake-cli " + commandArgs(c).map(quote).join(" ");
}
export function githubCommand(c) {
  const quote=c.platform==="windows-latest" ? quotePS : quoteBash;
  const params=Object.entries(actionInputs(c)).flatMap(([k,v])=>["-f",quote(k+"="+v)]);
  return "gh workflow run pake-cli.yaml --repo Base27-CVNSS/Appdesk --ref main " + params.join(" ");
}
export function scriptText(c) {
  if(c.platform==="windows-latest") {
    return [
      "# Appdesk / Windows PowerShell - yeu cau Node.js 20.9+, Rust, Tauri",
      "$ErrorActionPreference = 'Stop'",
      "if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw 'Can cai Node.js truoc khi build.' }",
      "& " + cliCommand(c),
      "if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }",
      ""
    ].join("\n");
  }
  return [
    "#!/usr/bin/env bash",
    "# Appdesk - yeu cau Node.js 20.9+, Rust, Tauri",
    "set -euo pipefail",
    "command -v npx >/dev/null 2>&1 || { echo 'Can cai Node.js truoc khi build.' >&2; exit 1; }",
    cliCommand(c),""
  ].join("\n");
}
export function fileSlug(name) {
  return (name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D")
    .replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,55)||"ung-dung").toLowerCase();
}
export function manifest(c) {
  return JSON.stringify({
    generator:"Appdesk",format:"appdesk-workflow-inputs-v1",
    note:"Thong so cho GitHub Actions; KHONG phai file config Pake CLI.",
    workflow:WORKFLOW_URL,inputs:actionInputs(c),local_command:cliCommand(c)
  },null,2)+"\n";
}
