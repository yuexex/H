import * as d3 from "d3";

export const addNodeOnDblClick = (
  svg,
  nodes,
  setNodes,
  links,
  setLinks,
  lastNodeId,
  setLastNodeId
) => {
  svg.on("dblclick", function (event) {
    const [x, y] = d3.pointer(event);
    const newNode = {
      id: String.fromCharCode(lastNodeId + 1),
      x,
      y,
      reflexive: false,
    };
    const newNodes = [...nodes, newNode];
    const newLinks = [
      ...links,
      {
        source: nodes[nodes.length - 1],
        target: newNode,
        left: false,
        right: true,
      },
    ];

    setNodes(newNodes);
    setLinks(newLinks);
    setLastNodeId(lastNodeId + 1);
  });
};
