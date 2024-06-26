import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { addNodeOnDblClick } from "../Util/addNodeOnDblClick";
import ExportButton from "./ExportButton";
import D3Header from "./D3Header";
import RemoveButton from "./RemoveButton";
import styled from "styled-components";

const DivColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
  gap: 10px;
`;

const DivRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-items: center;
  gap: 10px;
`;

const NewNodeInput = styled.input`
  padding: 10px;
  box-sizing: border-box;
  height: 40px;
  border-radius: 10px;
  outline: none;
  border: 1px solid black;
  background-color: transparent;
  font-family: Arial;
  font-weight: 500;
  font-size: 18px;
`;

const D3Chart = ({ width, height, strength }) => {
  const d3Container = useRef(null);
  const [nodes, setNodes] = useState([
    { id: "A", reflexive: false },
    { id: "B", reflexive: false },
    { id: "C", reflexive: false },
  ]);
  const [links, setLinks] = useState([
    { source: "A", target: "B", left: false, right: true },
    { source: "B", target: "C", left: false, right: true },
  ]);
  const [lastNodeId, setLastNodeId] = useState("C".charCodeAt(0));
  const [mousedownNode, setMousedownNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [newNodeText, setNewNodeText] = useState("");

  useEffect(() => {
    const svg = d3.select(d3Container.current);

    svg.on("dblclick", null);
    svg.on("click", null);

    const dragLine = svg
      .append("path")
      .attr("class", "link dragline hidden")
      .attr("d", "M0,0L0,0")
      .style("marker-end", "url(#end-arrow)");

    const updateGraph = () => {
      svg.selectAll("*").remove();

      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d) => d.id)
            .distance(150)
        )
        .force("charge", d3.forceManyBody().strength(-strength))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

      const link = svg
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke-width", 2)
        .attr("stroke", "#000")
        .attr("marker-end", "url(#arrowhead)");

      const node = svg
        .append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter()
        .append("g");

      node.append("circle").attr("r", 15).attr("fill", "#00000000");

      node
        .append("text")
        .attr("x", -5)
        .attr("y", -5)
        .text((d) => d.id)
        .style("user-select", "none");

      node.on("mousedown", (event, d) => {
        if (event.ctrlKey) return;
        setMousedownNode(d);
        dragLine
          .classed("hidden", false)
          .attr("d", `M${d.x},${d.y}L${d.x},${d.y}`);
      });

      node.on("mouseup", (event, d) => {
        if (!mousedownNode) return;

        dragLine.classed("hidden", true);

        const newLink = {
          source: mousedownNode,
          target: d,
          left: false,
          right: true,
        };
        setLinks([...links, newLink]);
        setMousedownNode(null);
        updateGraph();
      });

      node
        .on("click", (event, d) => {
          if (selectedNode === null) {
            setSelectedNode(d);
          } else {
            const newLink = {
              source: selectedNode,
              target: d,
              left: false,
              right: true,
            };
            setLinks([...links, newLink]);
            setSelectedNode(null);
            updateGraph();
          }
        })
        .call(
          d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

      svg.on("mousemove", function (event) {
        if (!mousedownNode) return;

        const [x, y] = d3.pointer(event);
        dragLine.attr("d", `M${mousedownNode.x},${mousedownNode.y}L${x},${y}`);
      });

      svg.on("mouseup", function () {
        if (mousedownNode) {
          dragLine.classed("hidden", true);
          setMousedownNode(null);
        }
      });

      addNodeOnDblClick(
        svg,
        nodes,
        setNodes,
        links,
        setLinks,
        lastNodeId,
        setLastNodeId
      );

      function ticked() {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node.attr("transform", (d) => `translate(${d.x},${d.y})`);
      }

      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return () => {
        svg.selectAll("*").remove();
        simulation.stop();
      };
    };

    const cleanup = updateGraph();

    return () => {
      if (cleanup) cleanup();
    };
  }, [width, height, nodes, links, mousedownNode, strength, lastNodeId]);

  const removeLastNode = () => {
    if (nodes.length > 1) {
      const newNodes = nodes.slice(0, nodes.length - 1);
      const newLinks = links.filter(
        (link) =>
          link.source.id !== nodes[nodes.length - 1].id &&
          link.target.id !== nodes[nodes.length - 1].id
      );
      setNodes(newNodes);
      setLinks(newLinks);
      setLastNodeId(lastNodeId - 1);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && newNodeText.trim() !== "") {
      const svg = d3.select(d3Container.current);
      const randomX = Math.random() * width;
      const randomY = Math.random() * height;
      const customNode = {
        x: randomX,
        y: randomY,
        id: newNodeText.trim(),
      };
      addNodeOnDblClick(
        svg,
        nodes,
        setNodes,
        links,
        setLinks,
        lastNodeId,
        setLastNodeId,
        customNode
      );
      setNewNodeText("");
    }
  };

  return (
    <DivColumn>
      <D3Header svgRef={d3Container} width={width} height={height} />
      <svg ref={d3Container} width={width} height={height}></svg>
      <DivRow>
        <ExportButton svgRef={d3Container} />
        <RemoveButton onClick={removeLastNode} />
        <NewNodeInput
          value={newNodeText}
          onChange={(e) => setNewNodeText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add new node"
        />
      </DivRow>
    </DivColumn>
  );
};

export default D3Chart;
