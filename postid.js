document.addEventListener('DOMContentLoaded', function(){

	document.querySelector('#add-url').addEventListener('click',function(){
		var selects = document.querySelector('#url-list');
		var url = document.querySelector('#url').value;
		
		var option = document.createElement('option');
		option.setAttribute('value', url);
		option.innerHTML = url;
		selects.appendChild(option);
	}, false);
	
	document.querySelector('#save-urls').addEventListener('click',function(){
		storeUrls('urls', '#url-list');
	}, false);
	
	document.querySelector('#get-postid').addEventListener('click',function(){
		var urls = document.querySelector('#url-list').value;
		var url = urls.match(/^[httpsfile]+:\/{2,3}([0-9a-z\.\-:]+?):?[0-9]*?\//i)[0];
		var domain = urls.match(/^[httpsfile]+:\/{2,3}([0-9a-z\.\-:]+?):?[0-9]*?\//i)[1];
		var max = 500;
		
		getPostId(url, max, '#result');
		
	}, false);
	
	loadUrls('urls', '#url-list');
	
}, false);

function storeUrls(key, selector)
{
	var selects = document.querySelectorAll('#url-list option');
	var json = {urls: [
	]};

	Array.prototype.forEach.call(selects, function(select, index) {
		
		var url = { "url": select.value };
		json.urls.push(url);
	});
	
	var value = JSON.stringify(json, undefined, 2);
	var options = {
		urls: value
	}
	chrome.storage.local.set(options, function() {
		console.log('Stored URLs!');
	});
}

function loadUrls(key, selector)
{
	var defaults = {
		urls: ""
	}
	chrome.storage.local.get(defaults, function(options){
		var selects = document.querySelector('#url-list');
		
		var json = JSON.parse(options.urls);
		if (null != json)
		{
			for (i = 0; i < json.urls.length; ++i)
			{
				var option = document.createElement('option');
				option.setAttribute('value', json.urls[i]['url']);
				option.innerHTML = json.urls[i]['url'];
				selects.appendChild(option);
			}
		}
	});
}

function getPostId(blogUrl, maxResults, selector)
{
	// フィードURLを作成する。
	var feedUrl = blogUrl;
	feedUrl += 'feeds/posts/summary';
	feedUrl += '?orderby=published';
	feedUrl += '&max-results=';
	feedUrl += maxResults;
	feedUrl += '&alt=json';

	// フィードを取得する。
	fetch(feedUrl)
		.then((response) => {
			console.log(feedUrl);

			if(response.ok) {
				return response.json();
			} else {
				throw new Error();
			}
		})
		.then(function(json) {
			console.log(json);

			// 記事総数、ページ総数を算出する。
			var totalResults = parseInt(json.feed.openSearch$totalResults.$t, 10);
			var startIndex   = parseInt(json.feed.openSearch$startIndex.$t, 10);
			var itemsPerPage = parseInt(json.feed.openSearch$itemsPerPage.$t, 10);

			var totalPage = parseInt(totalResults / maxResults );
			if ((totalResults % maxResults ) > 0)
			{
				 totalPage += 1;
			}
			console.log('totalResults=' + totalResults);
			console.log('totalPage=' + totalPage);

			// 結果をHTMLに整形する。
			var pager = '<table><tbody>';
			
			pager += '<thead><tr>';
			pager += '<th>No</th><th>Post id</th><th>Title</th>';
			pager += '</tr><thead>';
			
			for (i = 0; i < totalResults; ++i)
			{
				// idは以下の形式。
				// $t = "tag:blogger.com,1999:blog-XXXXXXXXXXXXXXXXXXX.post-XXXXXXXXXXXXXXXXXXX"

				var idstr = json.feed.entry[i].id.$t;
				var tags = idstr.split(',');
				var value = tags[1].split(':');
				var ids = value[1].split('.');
				var postid = ids[1].split('-');
				
				var id = idstr.split(',')[1].split(':')[1].split('.')[1].match(/(post-)\d+/)[0];
				console.log(id);
				
				pager += '<tr>';
				pager += '<td>' + i + '</td><td>' + postid[1] + '</td><td>' + json.feed.entry[i].title.$t + '</td>';
				pager += '</tr>';
			}
			pager +='</tbody></table>';

			// HTMLへ書き出す。
			var pagerElem = document.querySelector(selector);
			if (null != pagerElem)
			{
				pagerElem.innerHTML = pager;
			}
		})
		.catch((error) => {
			console.log(error)
		});
}
