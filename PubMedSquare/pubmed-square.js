$(document).ready(function() {

	current_query = $('#search-bar-input').val();

	$('#search-button').click(function(){
		//TODO check if the query is still the same
		pubmedSearch($('#search-bar-input').val());
	});

	$(document).keyup(function(e) {
		if (e.keyCode == 13) {
			pubmedSearch($('#search-bar-input').val());
		}
	});



	$('#container').isotope({
		masonry: {
			columnWidth: 0
		},
		getSortData : {
			citation : function ( $elem ) {
				return parseInt($elem.attr('citation'), 10 );
			},
			date : function ( $elem ) {
				return parseInt($elem.attr('date'), 10 );
			}
		}
	}).isotope({ sortBy : 'date', sortAscending : false});

	$('#sort-citations').click(function(){
		$('#container').isotope({ sortBy : 'citation', sortAscending : false});
		return false;
	});

	$('#sort-date').click(function(){
		$('#container').isotope({ sortBy : 'date', sortAscending : false});
		return false;
	});

	$('#more-results').click(function(){
		console.log("clicked");
		pubmedSearch(current_query);
		return false;
	});



});

var $container = $('#container');
var window_articles = 0;
var current_query;

function pubmedSearch(query){

	$("#loading").show();
	moveSearchBarToTheTop();
	current_query = query;
	//TODO dealing with the errors there
	//TODO put this request dans une method separee
	$.ajax({
		type: "GET",
		async: true,
		url: "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
		data: { db: "pubmed", retmax: "1000", term: query }
	}).done(function( xml ) {
		var ids = [];
		$(xml).find('IdList Id').each(function(){
			ids.push($(this).text());
		});

		var id_to_retrieve = [];
		for(var i = window_articles; i < window_articles + 20; i++){
			if(ids[i] != undefined){
				id_to_retrieve.push(ids[i]);
			}
		}
		window_articles = window_articles + 20;
		if(id_to_retrieve[0] != undefined){
			$.ajax({
				type: "GET",
				async: true,
				url: "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
				data: { db: "pubmed", id: id_to_retrieve.join(","), rettype: "full", retmode: "xml" }
			}).done(function( xml ) {

				$(xml).find('PubmedArticle').each(function(){

					var year = $(this).find('[PubStatus="entrez"] Year').text();
					var month = $(this).find('[PubStatus="entrez"] Month').text();
					var day = $(this).find('[PubStatus="entrez"] Day').text();
					var daydate = year*365 + month*12 + day;
					
					var authorsList = "";
					
					var authors = $(this).find('AuthorList Author').each(function(){
						var lastname = $(this).find('LastName').text();
						var initial = $(this).find('Initials').text();
						
						if(authorsList == ""){
							authorsList = lastname + " " + initial;
						}else{
							authorsList += ", " + lastname + " " + initial;
						}
						
					});
																				
					var title = $(this).find('ArticleTitle').text();
					var issn = $(this).find('ISSNLinking').text();
					var pmid = $(this).find('PMID').text();
					var affiliation = $(this).find('Affiliation').text();
					var abbrevJournal = $(this).find('ISOAbbreviation').text();

					var impact = getCitation(issn);
					var article = new Article();
					//TODO gerer les errueurs si les fielsds sont blanc, checl for null
					article.setImpact(impact);
					article.title = title;
					article.pmid = pmid;
					article.affiliation = affiliation;
					article.abbrevJournal = abbrevJournal;
					article.date = daydate;
					article.authors = authorsList;
					console.log(authorsList);
					article.registerClick($container);
					article.render($container);
				});
			});
		}
	});
}

function moveSearchBarToTheTop(){
	$("#out").animate({
		top: "0%"
	}, 800 );
}