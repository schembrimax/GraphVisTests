import cytoscape from "cytoscape";

export class GraphElement {
    nodes: cytoscape.ElementDefinition[]
  }
  
  export class GraphElementStyle {
    style: cytoscape.Stylesheet[]
  }
  
  export class GraphOptions {
    data: cytoscape.LayoutOptions | undefined
  }


  export enum GraphCurveType {
    haystack = 'haystack',
    straight = 'straight',
    bezier = 'bezier',
    unbundledBezier = 'unbundled-bezier',
    segments = 'segments',
    taxi = 'taxi'
  }
  
  export enum GraphArrowType {
    tee = 'tee',
    vee = 'vee',
    triangle = 'triangle',
    triangleTee = 'triangle-tee',
    circleTriangle = 'circle-triangle',
    triangleCross = 'triangle-cross',
    triangleBackcurve = 'triangle-backcurve',
    square = 'square',
    circle = 'circle',
    diamond = 'diamond',
    chevron = 'chevron',
    none = 'none'
  }
  
  export enum GraphNodeType {
    rectangle = 'rectangle',
    roundrectangle = 'roundrectangle',
    ellipse = 'ellipse',
    triangle = 'triangle',
    pentagon = 'pentagon',
    hexagon = 'hexagon',
    heptagon = 'heptagon',
    octagon = 'octagon',
    star = 'star',
    barrel = 'barrel',
    diamond = 'diamond',
    vee = 'vee',
    rhomboid = 'rhomboid',
    polygon = 'polygon',
    tag = 'tag',
    roundRectangle = 'round-rectangle',
    roundTriangle = 'round-triangle',
    roundDiamond = 'round-diamond',
    roundPentagon = 'round-pentagon',
    roundHexagon = 'round-hexagon',
    roundHeptagon = 'round-heptagon',
    roundOctagon = 'round-octagon',
    roundTag = 'round-tag',
    cutRectangle =  'cut-rectangle',
    bottomRoundRectangle = 'bottom-round-rectangle',
    concaveHexagon = 'concave-hexagon'
  }