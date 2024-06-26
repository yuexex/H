import * as d3 from "d3";

export const addNodeOnClick = (svg, nodes, setNodes, links, setLinks) => {
  svg.on("click", function (event) {
    const [x, y] = d3.pointer(event);
    const newNode = {
      id: String.fromCharCode(nodes.length + 65),
      x,
      y,
      reflexive: false,
    };
    const newNodes = [...nodes, newNode];
    const newLinks = [
      ...links,
      {
        source: nodes[nodes.length - 1].id,
        target: newNode.id,
        left: false,
        right: true,
      },
    ];

    setNodes(newNodes);
    setLinks(newLinks);
  });
};
