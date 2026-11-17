// Original RivoMesh geometry. No embedded fonts or third-party logo assets.
export const palette={blue:'#2859a6',light:'#94bcfa',ink:'#172a45',night:'#111c2d',paper:'#f7f9fc',line:'#dce4ef',teal:'#247f7c'}
export const concepts={
 a:{name:'Flow R',body:'<path d="M18 52V12h16c22 0 22 27 0 27H18m16 0 18 15M5 25h13" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="square" stroke-linejoin="round"/>'},
 b:{name:'Continuity R',body:'<path d="M13 10h22c11 0 19 8 19 18S46 46 35 46H26v-9h9c6 0 10-4 10-9s-4-9-10-9H22v35h-9V35H4v-9h9V10Z"/><path d="M29 37h11l15 17H43L29 37Z"/>'},
 c:{name:'Mesh R',body:'<path d="M12 54V12h22l17 16-17 16H23m10-1 18 11M4 33h18" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="bevel"/>'}
}
export const selected='b'
export const previousBody='<path d="M14 36V13h11c13 0 13 16 0 16H14m11 0 11 10M9 20h9m-9 8h9" fill="none" stroke="currentColor" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"/>'
export function mark({concept=selected,color=palette.blue,tile=false,mono=false,small=false}={}){
 const art=concepts[concept].body
 const background=tile?`<rect width="64" height="64" rx="${small?13:15}" fill="${mono?'#111':palette.blue}"/>`:''
 const glyph=tile?`<g transform="translate(7 7) scale(.78)" color="${mono?'#fff':'#fff'}" fill="currentColor">${art}</g>`:`<g color="${color}" fill="currentColor">${art}</g>`
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${background}${glyph}</svg>`
}
// Bespoke geometric lettering, drawn as vector paths; no font is downloaded or redistributed.
const glyphs=[
 [23,'M2 29V3h10c14 0 14 16 0 16H2m10 0 11 10'],
 [10,'M4 12v17M4 3v1'],
 [23,'m2 12 8 17 9-17'],
 [24,'M20 21c0 12-17 12-17 0s17-12 17 0Z'],
 [31,'M3 29V3l12 17L27 3v26'],
 [23,'M3 20h16c0-12-16-12-16 1 0 10 11 12 17 6'],
 [23,'M19 14c-5-5-16-3-16 3s16 3 16 9c0 5-11 7-17 2'],
 [24,'M3 3v26m0-12c3-8 16-8 16 2v10']
]
export function lettering(color=palette.ink){let x=0;return `<g fill="none" stroke="${color}" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round">`+glyphs.map(([advance,d])=>{const result=`<path transform="translate(${x} 0)" d="${d}"/>`;x+=advance;return result}).join('')+'</g>'}
export function wordmark({dark=false,mono=false}={}){
 const color=mono?'#111':dark?palette.light:palette.blue,text=mono?'#111':dark?'#edf3fc':palette.ink
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 304 64"><g color="${color}" fill="currentColor">${concepts[selected].body}</g><g transform="translate(79 12) scale(1.18)">${lettering(text)}</g></svg>`
}
