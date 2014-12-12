We need to make the hierarchical tree of application parts.
The goal is to be able to find cascading application parts.
A cascading of application part, is an application part that contain another application part.
This second application part could be appent to the first application part.

// parent
1 {
  2 { // 2 
    3 { // 3

    }
  }
}

into 

// parent
1.then { // 1
  2
}
.then { // 2
  3
}
.then { // 3
  
}


What are the rules that allow or prevent the composition of due.
- 2 needs to returns the due.
  -> 3 needs to be direct child of 2 
- identifiers shared between 2 and 3 needs to be moved to the parent
  -> remove the declarations from 2 and 3
  -> declare the variables into parent.


# A chain is :
- a root :
  - a variable declarator
  - a root rupture point
- one or more links :
  - an application part, direct child of the previous application part

# Direct child means :
The chain between the root and a rupture point needs to be consisting solely of rupture points
(CallExpression > FunctionExression > Body > CallExpression > FunctionExpression > ...)

If a parent has more than one child : break the chain.
(Or, if only one child got children, then continue the chain for this child)

**.ChainBuilder**
It builds the chain of application parts.

**.ControlFlowPredictor**
The CallExpressions needs to return the due.
So it needs to happen, and there needs to be no other return value (shounldn't though).
The ControlFlowPredictor analyses the control flow and say if the asynchronous call is eventually going to happen, or if it is uncertain due to some control flow.
If there is any kind of control flow BEFORE the rupture point -> break the chain.
For example, if the return happen before the asynchronous call.


Remove the declaration of shared identifiers from the child, and move them into the parent.





1 - build the trees of direct child application parts
    A node can have many children.

2 - Build the chains from the tree
    If a node has many children, if only one has children, continue the chain with him.
    The other ones are turned into small chains.

3 - Inside a chain, find and list the shared identifiers.

4 - Modify the code accordingly to these modifications