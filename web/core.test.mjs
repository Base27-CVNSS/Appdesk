import test from "node:test";
import assert from "node:assert/strict";
import {parseSettings,actionInputs,cliCommand,githubCommand,scriptText,fileSlug,manifest} from "./core.mjs";
const src={url:"https://example.com/path?x=1",name:"Bản đồ Việt Nam",platform:"windows-latest",width:1200,height:780,version:"1.0.0",targets:"deb"};
test("Validate URL, icon and app name",()=>{
 assert.throws(()=>parseSettings({...src,url:"javascript:alert(1)"}),/HTTP/);
 assert.throws(()=>parseSettings({...src,url:"https://u:p@example.com"}),/HTTP/);
 assert.throws(()=>parseSettings({...src,name:"name\ninjection"}),/Tên ứng dụng/);
 assert.throws(()=>parseSettings({...src,icon:"file:///tmp/x"}),/biểu tượng/);
});
test("PowerShell quotes a name containing apostrophe",()=>{
 const c=parseSettings({...src,name:"D'Art GIS"});
 assert.match(cliCommand(c),/D''Art GIS/);
 assert.match(githubCommand(c),/workflow run pake-cli.yaml/);
 assert.match(scriptText(c),/ErrorActionPreference/);
});
test("Linux shell and format selection",()=>{
 const c=parseSettings({...src,platform:"ubuntu-24.04",targets:"deb,appimage",newWindow:true});
 assert.match(cliCommand(c),/'--targets' 'deb,appimage'/);
 assert.equal(actionInputs(c).targets,"deb,appimage");
 assert.match(scriptText(c),/^#!\/usr\/bin\/env bash/);
});
test("Mac-specific flags do not leak into Windows",()=>{
 assert.equal(parseSettings({...src,hideTitle:true,multiArch:true}).multiArch,false);
 const c=parseSettings({...src,platform:"macos-latest",hideTitle:true,multiArch:true});
 assert.match(cliCommand(c),/multi-arch/);
 assert.equal(actionInputs(c).hide_title_bar,"true");
});
test("Export readable manifest and ASCII slug",()=>{
 const c=parseSettings(src);
 assert.equal(fileSlug(c.name),"ban-do-viet-nam");
 assert.equal(JSON.parse(manifest(c)).inputs.name,c.name);
});
