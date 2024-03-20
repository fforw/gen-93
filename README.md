# gen-93

This one uses shapes drawn between random points chosen from a limited set of fixed screen positions.

![Diagram of random point locations](./media/points.png)
                                                       
Two points are chosen and drawn with (weighted) random shapes and a gradient background chosen from a random palette.

Several of these shapes are set up and then filled with "evenodd" / xor-filling with that gradient. 

* circle using the the two points as center and radius
* square using the the two points as center and one of the corners
* a random-width line between the points
 
Several layers of that are overlayed more of less alpha-transparent.

The basic concept has been ready for some time and I have been testing several attempts of creating more textured outputs.

Still WIP
