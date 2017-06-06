class HomeCtrl {
  constructor($rootScope, $scope, $timeout, extensionManager) {

    let delimiter = ".";

    $scope.resolveRawTags = function() {
      var resolved = $scope.masterTag.rawTags.slice();

      var findResolvedTag = function(title) {
        for(var tag of $scope.masterTag.rawTags) {
          if(tag.content.title === title) {
            return tag;
          }
        }
        return null;
      }

      for(var tag of $scope.masterTag.rawTags) {
        tag.children = [];
      };

      for(var tag of $scope.masterTag.rawTags) {
        var name = tag.content.title;
        var comps = name.split(delimiter);
        tag.displayTitle = comps[comps.length -1];
        if(comps.length == 1) {
          continue;
        }

        var parentTitle = comps.slice(0, comps.length - 1).join(delimiter);
        var parent = findResolvedTag(parentTitle);
        if(!parent) {
          console.log("Parent not found for", parentTitle);
          continue;
        }

        // console.log("Adding", tag.content.title, "to", parent.content.title);

        parent.children.push(tag);

        // remove chid from master list
        var index = resolved.indexOf(tag);
        resolved.splice(index, 1);
      }

      // console.log("Resolved:", resolved);

      $scope.masterTag.children = resolved;
    }

    $scope.changeParent = function(sourceId, targetId) {

      var source = $scope.masterTag.rawTags.filter(function(tag){
        return tag.uuid === sourceId;
      })[0];

      var target = targetId === "0" ? $scope.masterTag : $scope.masterTag.rawTags.filter(function(tag){
        return tag.uuid === targetId;
      })[0];

      var needsSave = [source];

      var adjustChildren = function(source) {
        for(var child of source.children) {
          var newTitle = source.content.title + delimiter + child.content.title.split(delimiter).slice(-1)[0];
          child.content.title = newTitle;
          needsSave.push(child);
          adjustChildren(child);
        }
      }

      var newTitle;
      if(target.master) {
        newTitle = source.content.title.split(delimiter).slice(-1)[0];
      } else {
        newTitle = target.content.title + delimiter + source.content.title.split(delimiter).slice(-1)[0];
      }
      source.content.title = newTitle;
      adjustChildren(source);


      $scope.resolveRawTags();

      extensionManager.saveItems(needsSave);
    }

    $scope.selectTag = function(tag) {
      if(tag.master) {
        extensionManager.clearSelection();
      } else {
        extensionManager.selectItem(tag);
      }
      if($scope.selectedTag) {
        $scope.selectedTag.selected = false;
      }
      $scope.selectedTag = tag;
      tag.selected = true;
    }

    extensionManager.streamItems(function(newTags) {
      console.log("New stream data:", newTags);

      var allTags = $scope.masterTag ? $scope.masterTag.rawTags : [];
      for(var tag of newTags) {
        var existing = allTags.filter(function(tagCandidate){
          return tagCandidate.uuid === tag.uuid;
        })[0];
        if(existing) {
          Object.assign(existing, tag);
        } else {
          allTags.push(tag);
        }
      }

      console.log("All tags", allTags);

      $scope.masterTag = {
        master: true,
        content: {
          title: ""
        },
        displayTitle: "All",
        rawTags: allTags,
        uuid: "0"
      }

      $scope.resolveRawTags();
    }.bind(this))
  }

}

angular.module('app').controller('HomeCtrl', HomeCtrl);