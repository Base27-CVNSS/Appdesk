import {
  parseSettings,
  actionInputs,
  cliCommand,
  githubCommand,
  scriptText,
  fileSlug,
  manifest,
} from "./core.mjs";
const $ = (id) => document.getElementById(id);
const form = $("form");
let current = null,
  toastTimer;
function platform() {
  return document.querySelector('input[name="platform"]:checked').value;
}
function raw() {
  return {
    url: $("url").value,
    name: $("name").value,
    version: $("version").value,
    icon: $("icon").value,
    platform: platform(),
    width: $("width").value,
    height: $("height").value,
    targets: $("targets").value,
    newWindow: $("newWindow").checked,
    fullscreen: $("fullscreen").checked,
    hideTitle: $("hideTitle").checked,
    multiArch: $("multiArch").checked,
  };
}
function preview() {
  const c = raw(),
    mac = c.platform === "macos-latest",
    linux = c.platform === "ubuntu-24.04";
  $("linuxRow").hidden = !linux;
  $("macTitleRow").hidden = !mac;
  $("multiArchRow").hidden = !mac;
  $("previewPlatform").textContent = linux
    ? "Linux"
    : mac
      ? "macOS"
      : "Windows";
  const fmts = {
    deb: "DEB",
    appimage: "AppImage",
    rpm: "RPM",
    zst: "ZST",
    "deb,appimage": "DEB + AppImage",
  };
  $("previewFormat").textContent = linux
    ? fmts[c.targets]
    : mac
      ? "DMG"
      : "MSI";
  $("previewName").textContent = c.name.trim() || "Ứng dụng của bạn";
  $("windowTitle").textContent = c.name.trim() || "Tên ứng dụng";
  $("previewSize").textContent = (c.width || "—") + " × " + (c.height || "—");
  let host = "website-cua-ban.vn";
  try {
    const u = new URL(c.url.trim());
    if (["https:", "http:"].includes(u.protocol)) host = u.hostname;
  } catch {}
  $("previewHost").textContent = host;
}
function renderInputs(c) {
  const labels = {
    platform: "Platform",
    url: "Website URL",
    name: "Tên ứng dụng",
    icon: "Icon URL",
    width: "Rộng",
    height: "Cao",
    app_version: "Phiên bản",
    fullscreen: "Fullscreen",
    hide_title_bar: "Ẩn tiêu đề Mac",
    new_window: "Cửa sổ mới",
    multi_arch: "Universal Mac",
    targets: "Định dạng Linux",
  };
  const dest = $("actionInputs");
  dest.replaceChildren();
  for (const [key, value] of Object.entries(actionInputs(c))) {
    if (key === "icon" && !value) continue;
    if (key === "targets" && c.platform !== "ubuntu-24.04") continue;
    if (
      ["multi_arch", "hide_title_bar"].includes(key) &&
      c.platform !== "macos-latest"
    )
      continue;
    const box = document.createElement("div"),
      label = document.createElement("span"),
      val = document.createElement("strong");
    box.className = "param";
    label.textContent = labels[key] || key;
    val.textContent = value || "Để trống";
    box.append(label, val);
    dest.append(box);
  }
}
function toast(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("toast").hidden = true), 3000);
}
async function copy(value) {
  try {
    if (!navigator.clipboard || !window.isSecureContext)
      throw Error("No Clipboard API");
    await navigator.clipboard.writeText(value);
    toast("Đã sao chép.");
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.append(area);
    area.select();
    try {
      if (!document.execCommand("copy")) throw Error("Copy blocked");
      toast("Đã sao chép.");
    } catch {
      toast("Không thể sao chép tự động, vui lòng sao chép thủ công.");
    } finally {
      area.remove();
    }
  }
}
function download(name, body, mime) {
  const url = URL.createObjectURL(
    new Blob([body], { type: mime + ";charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
form.addEventListener("input", () => {
  preview();
  $("error").hidden = true;
});
form.addEventListener("change", preview);
form.addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    current = parseSettings(raw());
    $("error").hidden = true;
    renderInputs(current);
    $("cliCommand").textContent = cliCommand(current);
    $("ghCommand").textContent = githubCommand(current);
    $("result").hidden = false;
    $("result").scrollIntoView({ behavior: "smooth", block: "start" });
    $("result").focus({ preventScroll: true });
  } catch (err) {
    current = null;
    $("result").hidden = true;
    $("error").textContent = err.message;
    $("error").hidden = false;
    $("error").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
});
document.querySelectorAll(".examples button").forEach((button) =>
  button.addEventListener("click", () => {
    $("url").value = button.dataset.url;
    $("name").value = button.dataset.name;
    preview();
    $("url").focus();
  }),
);
$("copyInputs").addEventListener("click", () => {
  if (current)
    copy(
      Object.entries(actionInputs(current))
        .map(([k, v]) => k + ": " + v)
        .join("\n"),
    );
});
$("copyCli").addEventListener("click", () => {
  if (current) copy(cliCommand(current));
});
$("copyGh").addEventListener("click", () => {
  if (current) copy(githubCommand(current));
});
$("downloadScript").addEventListener("click", () => {
  if (!current) return;
  const ext = current.platform === "windows-latest" ? ".ps1" : ".sh";
  download(
    "build-" + fileSlug(current.name) + ext,
    scriptText(current),
    "text/plain",
  );
  toast("Đã tạo tập lệnh build.");
});
$("downloadJson").addEventListener("click", () => {
  if (!current) return;
  download(
    "appdesk-" + fileSlug(current.name) + ".json",
    manifest(current),
    "application/json",
  );
  toast("Đã tạo tệp JSON.");
});
preview();
