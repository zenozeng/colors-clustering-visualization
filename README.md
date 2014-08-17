# colors-clustering-visualization

Visualization demo for Colors Clustering using RGB &amp; K-means algorithm

This is a demo & intro for https://github.com/zenozeng/colors-clustering.

This demo was based on mbostock's Multi-Foci Force Layout.

http://bl.ocks.org/mbostock/1021953

Note for production usage:

- You should CIE76 or CIE2000 for color difference

- You should pick right ini colors (color keywords from CSS3 may be great)

## Ｋ-Means 算法介绍

http://baike.baidu.com/view/31854.htm

k-means 算法接受输入量 k ；然后将n个数据对象划分为 k个聚类以便使得所获得的聚类满足：同一聚类中的对象相似度较高；而不同聚类中的对象相似度较小。聚类相似度是利用各聚类中对象的均值所获得一个“中心对象”（引力中心）来进行计算的。

k-means 算法基本步骤

- 从 n个数据对象任意选择 k 个对象作为初始聚类中心；
- 根据每个聚类对象的均值（中心对象），计算每个对象与这些中心对象的距离；并根据最小距离重新对相应对象进行划分；
- 重新计算每个（有变化）聚类的均值（中心对象）；
- 计算标准测度函数，当满足一定条件，如函数收敛时，则算法终止；如果条件不满足则回到步骤（2）。

