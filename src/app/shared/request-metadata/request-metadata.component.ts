import { Component, Input, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeFlattener,
  MatTreeFlatDataSource,
} from '@angular/material/tree';
import { Observable, of } from 'rxjs';
import moment from 'moment';

class Node {
  children: Node[];
  text: string;
  value: any;
}

class FlatNode {
  text: string;
  level: number;
  value: any;
  expandable: boolean;
}

@Component({
  selector: 'request-metadata',
  templateUrl: 'request-metadata.component.html',
  styleUrls: ['request-metadata.component.scss'],
})
export class RequestMetadataComponent implements OnInit {
  @Input()
  data: any;

  @Input()
  title: string;

  description: string;
  treeControl: FlatTreeControl<FlatNode>;
  treeFlattener: MatTreeFlattener<Node, FlatNode>;
  dataSource: MatTreeFlatDataSource<Node, FlatNode>;

  ngOnInit(): void {
    this.description =
      this.data.description ||
      this.data.reason ||
      this.data.details ||
      this.data.note;
    if (this.data.description) {
      delete this.data.description;
    } else if (this.data.reason) {
      delete this.data.reason;
    } else if (this.data.details) {
      delete this.data.details;
    } else if (this.data.note) {
      delete this.data.note;
    }
    if (Object.keys(this.data).length > 0) {
      this.initTree();
      const tree = {};
      tree[this.title] = this.data;
      this.dataSource.data = this.buildFileTree(tree, 1);
    }
  }

  initTree() {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this._getLevel,
      this._isExpandable,
      this._getChildren
    );
    this.treeControl = new FlatTreeControl<FlatNode>(
      this._getLevel,
      this._isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );
  }

  buildFileTree(value: any, level: number) {
    let data: any[] = [];
    for (let k in value) {
      let v = value[k];
      let node = new Node();
      node.text = `${k}`;
      if (v === null || v === undefined) {
        // no action
      } else if (typeof v === 'object') {
        node.children = this.buildFileTree(v, level + 1);
      } else {
        if (
          node.text.toLowerCase().indexOf('date') >= 0 &&
          moment(v).isValid()
        ) {
          node.value = moment(v).format('dddd, MMMM Do YYYY, h:mm:ss a UTCZ');
        } else {
          node.value = v;
        }
      }
      data.push(node);
    }
    return data;
  }
  transformer = (node: Node, level: number) => {
    let flatNode = new FlatNode();
    flatNode.text = node.text;
    flatNode.level = level;
    flatNode.value = node.value;
    flatNode.expandable = !!node.children;
    return flatNode;
  };

  private _getLevel = (node: FlatNode) => {
    return node.level;
  };

  private _isExpandable = (node: FlatNode) => {
    return node.expandable;
  };

  private _getChildren = (node: Node): Observable<Node[]> => {
    return of(node.children);
  };

  hasChild = (_: number, _nodeData: FlatNode) => {
    return _nodeData.expandable;
  };
}
