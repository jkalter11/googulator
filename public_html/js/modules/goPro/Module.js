define(["GoogleAPIs"],function(GoogleAPIs){
    "use strict";

    var Module = {};

    var container;

    var authenticated = false;
    var active = false;

    Module.init = function(c){
        App.davis.get("/goPro",function(req){
            App.setActiveModule("goPro");
            document.title = "Googulator - Go Pro";
        });
        container = c;
    }

    Module.onActivate = function(params){
        if (Davis.location.current() != "/goPro")
            Davis.location.assign("/goPro");

        $("#paywithPaypalButton").click(function(){
            if (!authenticated){
                alert("You must login before you can ugprade to Googulator Pro");
                return false;
            }
            $("#paypalGoogleToken").attr("value",GoogleAPIs.getAuthToken());
            $("#inputMoney").blur();
            if (parseFloat($("#inputMoney").val()) < 5){
                alert("You must pay at least $5 to get Gogulator Pro");
                return false;
            }
            App.createMessageOverlay(container,"Redirecting You To Paypal...");
            return true;
        });
        $("#inputMoney").blur(function(){
            $("#inputMoney").val(parseFloat($("#inputMoney").val()).toFixed(2));
            if ($("#inputMoney").val() == "NaN")
                $("#inputMoney").val("0.00");
        });
        if (getParams.finishPurchase){
            var overlay = App.createMessageOverlay(container,"Finalizing Your purchase...");
            var onError = function (){
                overlay.remove();
                alert("An error occurred processing your order!");
                location.assign("/goPro");
            };
            $.ajax("/php/paypal/approvePurchase.php?googleid=" + encodeURIComponent(getParams.googleid) + "&token=" + encodeURIComponent(getParams.token) + "&PayerID=" + encodeURIComponent(getParams.PayerID),{
                success:function(result){

                    if (result !== null && result.id != null){
                        for (var i = 0, li = result.transactions.length; i < li; i++){
                            _gaq.push(['_addTrans',
                                result.id,           // transaction ID - required
                                'Googulator Web Store', // affiliation or store name
                                result.transactions[i].amount.total,          // total - required
                            ]);
                            for (var j = 0, lj = result.transactions[i].item_list.items.length; j < lj; j++){
                                _gaq.push(['_addItem',
                                    result.id,           // transaction ID - necessary to associate item with transaction
                                    result.transactions[i].item_list.items[j].sku,           // SKU/code - required
                                    result.transactions[i].item_list.items[j].name,        // product name
                                    result.transactions[i].item_list.items[j].price,          // unit price - required
                                    result.transactions[i].item_list.items[j].quantity
                                ]);

                            }
                            _gaq.push(['_trackTrans']);
                        }
                        overlay.remove();
                        alert("Congratulations! You now have Googulator Pro!");
                        return;
                    }
                    else{
                        onError();
                    }

                },
                error: onError
            })
        }
        active = true;
        if (App.userHasRole("ROLE_PRO"))
            App.setActiveModule("home");
    }

    Module.onFreeze = function(){
        active = false;

    }

    Module.onAuthenticated = function(){
        authenticated = true;
        if (active && App.userHasRole("ROLE_PRO"))
            App.setActiveModule("home");
    }

    return Module;
})